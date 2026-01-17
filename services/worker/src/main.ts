import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { Client as MinioClient } from "minio";

const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/api";
const apiSecret = process.env.API_INTERNAL_SECRET || "internal_secret";

const prisma = new PrismaClient();
const resolveRedisConnection = () => {
  const fallbackHost = process.env.REDIS_HOST || "localhost";
  const fallbackPort = Number(process.env.REDIS_PORT || 6379);
  const fallback = { host: fallbackHost, port: fallbackPort };
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) return fallback;

  try {
    const parsed = new URL(redisUrl);
    const connection: {
      host: string;
      port: number;
      username?: string;
      password?: string;
      db?: number;
    } = {
      host: parsed.hostname || fallbackHost,
      port: parsed.port ? Number(parsed.port) : fallbackPort
    };

    if (parsed.username) connection.username = parsed.username;
    if (parsed.password) connection.password = parsed.password;

    if (parsed.pathname && parsed.pathname !== "/") {
      const db = Number(parsed.pathname.slice(1));
      if (!Number.isNaN(db)) connection.db = db;
    }

    return connection;
  } catch {
    return fallback;
  }
};

const redisConnection = resolveRedisConnection();
const redis = new IORedis(redisConnection);
const riskQueue = new Queue("risk", { connection: redisConnection });
const importQueue = new Queue("imports", { connection: redisConnection });

const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minio",
  secretKey: process.env.MINIO_SECRET_KEY || "minio123"
});
const bucket = process.env.MINIO_BUCKET || "uploads";

setInterval(async () => {
  await redis.set("worker:heartbeat", new Date().toISOString(), "EX", 20);
}, 10000);

async function emit(room: string, event: string, payload: any) {
  await axios.post(
    `${apiBaseUrl}/internal/realtime/emit`,
    { room, event, payload },
    { headers: { "x-internal-secret": apiSecret } }
  );
}

function computeRisk(promised: number, current: number) {
  const delta = current - promised;
  const ratio = current / promised;
  const riskScore = Math.min(1, Math.max(0, delta / 30));
  return { delta, ratio, riskScore };
}

new Worker(
  "risk",
  async (job) => {
    if (job.name !== "calculate") return;
    const order = await prisma.order.findUnique({ where: { id: job.data.orderId } });
    if (!order) return;

    const currentEta = order.promisedEta + Math.floor(Math.random() * 20);
    const risk = computeRisk(order.promisedEta, currentEta);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        currentEta,
        etaDeltaMinutes: risk.delta,
        riskScore: risk.riskScore,
        riskReasons: { eta_ratio: risk.ratio }
      }
    });

    const shouldAlert = risk.delta >= 10 || risk.ratio >= 1.5;
    if (shouldAlert) {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60000);
      const dedupe = await prisma.notificationLog.findFirst({
        where: {
          orderId: order.id,
          alertType: "DELAY_RISK",
          createdAt: { gte: fifteenMinAgo }
        }
      });

      if (!dedupe) {
        const severity = risk.delta >= 30 ? "HIGH" : "MEDIUM";
        const alert = await prisma.alert.create({
          data: {
            orderId: order.id,
            type: "DELAY_RISK",
            severity,
            isNew: true
          }
        });
        await prisma.notificationLog.create({
          data: {
            userId: order.customerId,
            orderId: order.id,
            alertType: "DELAY_RISK",
            channel: "PUSH",
            status: "QUEUED"
          }
        });
        await emit(`customer:${order.customerId}`, "customer.alerts.new", {
          alert_id: alert.id,
          order_id: order.id,
          type: alert.type,
          severity: alert.severity
        });
        await emit("ops", "ops.alerts.new", {
          alert_id: alert.id,
          order_id: order.id,
          type: alert.type,
          severity: alert.severity
        });

        if (risk.delta >= 30) {
          await emit("ops", "ops.alerts.escalated", {
            alert_id: alert.id,
            order_id: order.id,
            severity: "HIGH",
            sla_breach: true
          });
        }
      }
    }

    await emit(`customer:${order.customerId}`, "customer.order.updated", {
      order_id: order.id,
      status: order.status,
      current_eta: currentEta,
      eta_delta_minutes: risk.delta
    });
    await emit("ops", "ops.orders.updated", {
      order_id: order.id,
      status: order.status,
      risk_score: risk.riskScore
    });
  },
  { connection: redisConnection }
);

new Worker(
  "imports",
  async (job) => {
    if (job.name !== "import") return;
    const batch = await prisma.uploadBatch.findUnique({ where: { id: job.data.batchId } });
    if (!batch) return;

    await prisma.uploadBatch.update({ where: { id: batch.id }, data: { status: "RUNNING" } });

    const urlParts = batch.fileUrl.replace("minio://", "").split("/");
    const objectName = urlParts.slice(1).join("/");

    const stream = await minio.getObject(bucket, objectName);
    const data = await new Promise<string>((resolve, reject) => {
      let output = "";
      stream.on("data", (chunk) => (output += chunk.toString()));
      stream.on("end", () => resolve(output));
      stream.on("error", reject);
    });

    const lines = data.split(/\r?\n/).filter(Boolean);
    const header = lines.shift()?.split(",") || [];
    let success = 0;
    let failed = 0;

    for (const line of lines) {
      const cols = line.split(",");
      const row: Record<string, string> = {};
      header.forEach((h, idx) => (row[h] = cols[idx]));

      const orderExternalId = row["order_external_id"];
      const addressLat = row["address_lat"];
      const addressLon = row["address_lon"];
      const customerZone = row["customer_zone"];
      const restaurantZone = row["restaurant_zone"];
      const itemsJson = row["items_json"];

      let error = "";
      if (!addressLat || !addressLon || !customerZone || !itemsJson) {
        error = "missing_required_fields";
      }

      let items: any[] = [];
      try {
        items = JSON.parse(itemsJson || "[]");
      } catch (e) {
        error = "invalid_items_json";
      }

      const exists = orderExternalId
        ? await prisma.order.findFirst({ where: { externalId: orderExternalId } })
        : null;
      const existsRow = orderExternalId
        ? await prisma.uploadRow.findFirst({ where: { orderExternalId } })
        : null;
      if (exists || existsRow) {
        error = "duplicate_order_external_id";
      }

      await prisma.uploadRow.create({
        data: {
          uploadBatchId: batch.id,
          rawRow: row,
          normalizedRow: row,
          error: error || null,
          orderExternalId: error ? null : orderExternalId || null
        }
      });

      if (error) {
        failed += 1;
        continue;
      }

      const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
      if (!customer) {
        failed += 1;
        continue;
      }

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          status: "CREATED",
          promisedEta: 25,
          currentEta: 25,
          etaDeltaMinutes: 0,
          riskScore: 0,
          deliveryMode: "INSTANT",
          restaurantZone: restaurantZone || "zone-a",
          customerZone: customerZone || "zone-a",
          addressLat: Number(addressLat),
          addressLon: Number(addressLon),
          paymentStatus: "PENDING",
          refundStatus: "NONE",
          externalId: orderExternalId || null
        }
      });

      for (const item of items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            name: item.name || "Item",
            quantity: item.quantity || 1,
            unitPrice: item.unit_price || 10
          }
        });
      }

      await riskQueue.add("calculate", { orderId: order.id });
      success += 1;
    }

    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        totalRows: success + failed,
        successRows: success,
        failedRows: failed
      }
    });
  },
  { connection: redisConnection }
);

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
