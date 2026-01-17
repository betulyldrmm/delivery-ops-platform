import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

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

@Injectable()
export class QueueService {
  private riskQueue: Queue;
  private importQueue: Queue;

  constructor() {
    const connection = resolveRedisConnection();
    this.riskQueue = new Queue("risk", { connection });
    this.importQueue = new Queue("imports", { connection });
  }

  async enqueueRisk(orderId: string) {
    await this.riskQueue.add("calculate", { orderId });
  }

  async enqueueImport(batchId: string) {
    await this.importQueue.add("import", { batchId });
  }
}
