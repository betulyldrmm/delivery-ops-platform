import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { RealtimeService } from "../realtime/realtime.service";

@Injectable()
export class OpsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private realtime: RealtimeService
  ) {}

  private readonly orderStatuses = new Set(Object.values(OrderStatus));
  private readonly roles = new Set(Object.values(Role));

  private parseOrderStatus(status: string) {
    if (!this.orderStatuses.has(status as OrderStatus)) {
      throw new BadRequestException("Invalid order status");
    }
    return status as OrderStatus;
  }

  private parseRole(role: string) {
    if (!this.roles.has(role as Role)) {
      throw new BadRequestException("Invalid role");
    }
    return role as Role;
  }

  private computeDelayLevel(etaDeltaMinutes: number) {
    if (etaDeltaMinutes >= 15) return "RED";
    if (etaDeltaMinutes >= 6) return "YELLOW";
    return "GREEN";
  }

  async getDashboard() {
    const activeOrders = await this.prisma.order.count({
      where: { status: { in: ["CREATED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP", "ON_ROUTE"] } }
    });
    const delayedOrders = await this.prisma.order.count({ where: { etaDeltaMinutes: { gte: 10 } } });
    const slaBreached = await this.prisma.order.count({ where: { etaDeltaMinutes: { gte: 30 } } });
    return {
      kpis: {
        active_orders: activeOrders,
        delayed_orders: delayedOrders,
        sla_breached_orders: slaBreached
      },
      series: [
        { name: "delay_trend", points: [] },
        { name: "risk_by_zone", points: [] }
      ]
    };
  }

  async listOrders(query: any) {
    const where: any = {};
    if (query.status) where.status = this.parseOrderStatus(query.status);
    if (query.risk) where.riskScore = { gte: 0.5 };
    if (query.zone) where.customerZone = query.zone;
    return this.prisma.order.findMany({ where, take: Number(query.limit) || 50 });
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateStatus(actorId: string, id: string, status: string) {
    const order = await this.getOrder(id);
    const parsedStatus = this.parseOrderStatus(status);
    const updated = await this.prisma.order.update({ where: { id }, data: { status: parsedStatus } });
    await this.prisma.orderStatusEvent.create({
      data: { orderId: id, status: parsedStatus, actorUserId: actorId }
    });
    await this.queue.enqueueRisk(id);
    this.realtime.emitOpsEvent("ops.orders.updated", { order_id: id, status: parsedStatus });
    this.realtime.emitCustomerEvent(order.customerId, "customer.order.updated", {
      order_id: id,
      status: parsedStatus
    });
    return updated;
  }

  async assignCourier(actorId: string, id: string, courierId: string) {
    const order = await this.getOrder(id);
    const isUuid = (value: string) => /^[0-9a-fA-F-]{36}$/.test(value);
    let resolvedCourierId = courierId && isUuid(courierId) ? courierId : null;
    let courierUser = null;
    if (!resolvedCourierId) {
      courierUser = await this.prisma.user.findFirst({ where: { role: "COURIER" } });
      resolvedCourierId = courierUser?.id || null;
    }
    let courier;
    if (resolvedCourierId) {
      courier = await this.prisma.courier.upsert({
        where: { id: resolvedCourierId },
        update: { isAvailable: false },
        create: {
          id: resolvedCourierId,
          name: courierUser?.email || "Demo Courier",
          currentLat: 41.02,
          currentLon: 29.0,
          isAvailable: false,
          capacity: 1
        }
      });
    } else {
      courier = await this.prisma.courier.create({
        data: {
          name: "Demo Courier",
          currentLat: 41.02,
          currentLon: 29.0,
          isAvailable: false,
          capacity: 1
        }
      });
    }
    await this.prisma.courierAssignment.create({ data: { orderId: id, courierId: courier.id } });
    const updated = await this.prisma.order.update({ where: { id }, data: { status: "ASSIGNED" } });
    await this.prisma.orderStatusEvent.create({ data: { orderId: id, status: "ASSIGNED", actorUserId: actorId } });
    await this.queue.enqueueRisk(id);
    this.realtime.emitOpsEvent("ops.orders.updated", { order_id: id, status: updated.status });
    this.realtime.emitCustomerEvent(order.customerId, "customer.order.updated", { order_id: id, status: updated.status });
    return updated;
  }

  async notifyCustomer(actorId: string, id: string, body: any) {
    const order = await this.getOrder(id);
    const log = await this.prisma.notificationLog.create({
      data: {
        userId: order.customerId,
        orderId: order.id,
        channel: (body.channel || "IN_APP").toUpperCase(),
        status: "QUEUED"
      }
    });
    this.realtime.emitCustomerEvent(order.customerId, "customer.notifications.new", {
      id: log.id,
      message: body.message || "Update"
    });
    return log;
  }

  async overrideEta(actorId: string, id: string, body: any) {
    const order = await this.getOrder(id);
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        promisedEta: Number(body.promised_eta || order.promisedEta),
        currentEta: Number(body.current_eta || order.currentEta)
      }
    });
    await this.prisma.auditLog.create({
      data: { actorUserId: actorId, action: "OVERRIDE_ETA", entityType: "order", entityId: id }
    });
    this.realtime.emitOpsEvent("ops.orders.updated", { order_id: id, status: updated.status });
    return updated;
  }

  async getMap() {
    const couriers = await this.prisma.courier.findMany();
    const activeStatuses: OrderStatus[] = [
      OrderStatus.CREATED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_ROUTE
    ];
    const zoneCenters: Record<string, { lat: number; lon: number }> = {
      "zone-a": { lat: 41.015, lon: 28.979 },
      "zone-b": { lat: 41.025, lon: 28.99 },
      "zone-c": { lat: 41.03, lon: 29.005 }
    };
    const orders = await this.prisma.order.findMany({
      where: { status: { in: activeStatuses } },
      include: {
        assignments: {
          where: { isActive: true, endedAt: null },
          orderBy: { assignedAt: "desc" },
          take: 1,
          include: { courier: true }
        }
      }
    });
    const snapshot = await this.prisma.trafficSnapshot.findFirst({
      orderBy: { expiresAt: "desc" }
    });
    let trafficStatus = "UNAVAILABLE";
    let lastSnapshotAgeMin: number | null = null;
    if (snapshot) {
      trafficStatus = snapshot.expiresAt < new Date() ? "UNAVAILABLE" : "OK";
      const ageMs = Date.now() - snapshot.expiresAt.getTime();
      lastSnapshotAgeMin = Math.abs(Math.floor(ageMs / 60000));
    }
    const mapOrders: Array<{
      id: string;
      status: OrderStatus;
      currentEta: number;
      etaDeltaMinutes: number;
      delayReason: string | null;
      delayLevel: "GREEN" | "YELLOW" | "RED";
      pickup: { lat: number; lon: number } | null;
      dropoff: { lat: number; lon: number } | null;
      courier: { id: string; lat: number; lon: number } | null;
    }> = [];

    for (const order of orders) {
      const assignment = order.assignments[0];
      const courier = assignment?.courier;
      const pickup = zoneCenters[order.restaurantZone] || null;
      const dropoff =
        Number.isFinite(order.addressLat) && Number.isFinite(order.addressLon)
          ? { lat: order.addressLat, lon: order.addressLon }
          : null;
      mapOrders.push({
        id: order.id,
        status: order.status,
        currentEta: order.currentEta,
        etaDeltaMinutes: order.etaDeltaMinutes,
        delayReason: order.delayReason ?? null,
        delayLevel: this.computeDelayLevel(order.etaDeltaMinutes),
        pickup,
        dropoff,
        courier: courier
          ? {
              id: courier.id,
              lat: courier.currentLat,
              lon: courier.currentLon
            }
          : null
      });
    }

    const mappedCouriers = couriers.map((courier) => ({
      id: courier.id,
      lat: courier.currentLat,
      lon: courier.currentLon,
      isAvailable: courier.isAvailable,
      status: courier.status,
      lastLocationAt: courier.lastLocationAt
    }));

    return { couriers: mappedCouriers, orders: mapOrders, trafficStatus, lastSnapshotAgeMin };
  }

  async listInventory() {
    return this.prisma.inventory.findMany();
  }

  async updateInventory(id: string, qty: number) {
    return this.prisma.inventory.update({ where: { id }, data: { qty } });
  }

  async getReports(query: any) {
    return { from: query.from, to: query.to, avg_eta: 28 };
  }

  async listUsers() {
    return this.prisma.user.findMany();
  }

  async updateRole(userId: string, role: string) {
    const parsedRole = this.parseRole(role);
    return this.prisma.user.update({ where: { id: userId }, data: { role: parsedRole } });
  }

  async updateCourierLocation(courierId: string, body: any) {
    const lat = Number(body?.lat);
    const lon = Number(body?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException("Invalid coordinates");
    }
    try {
      return await this.prisma.courier.update({
        where: { id: courierId },
        data: {
          currentLat: lat,
          currentLon: lon,
          lastLocationAt: new Date()
        }
      });
    } catch {
      throw new NotFoundException("Courier not found");
    }
  }

  async getAuditLogs(orderId?: string) {
    return this.prisma.auditLog.findMany({ where: orderId ? { entityId: orderId } : {} });
  }
}
