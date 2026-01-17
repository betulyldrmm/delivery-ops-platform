import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { RealtimeService } from "../realtime/realtime.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private realtime: RealtimeService
  ) {}

  private computeRisk(promised: number, current: number) {
    const delta = current - promised;
    const ratio = current / promised;
    const riskScore = Math.min(1, Math.max(0, delta / 30));
    const reasons: Record<string, unknown> = {
      eta_delta_minutes: delta,
      eta_ratio: ratio
    };
    return { delta, riskScore, reasons };
  }

  async listOrders(userId: string, limit: number) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      take: limit,
      orderBy: { createdAt: "desc" }
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: dto.address_id, userId }
    });
    if (!address) {
      throw new NotFoundException("Address not found");
    }
    const promisedEta = 25;
    const currentEta = 25;
    const risk = this.computeRisk(promisedEta, currentEta);
    const riskReasons = JSON.parse(JSON.stringify(risk.reasons)) as Prisma.InputJsonValue;
    const order = await this.prisma.order.create({
      data: {
        customerId: userId,
        status: "CREATED",
        promisedEta,
        currentEta,
        etaDeltaMinutes: risk.delta,
        riskScore: risk.riskScore,
        riskReasons,
        paymentStatus: "PENDING",
        refundStatus: "NONE",
        deliveryMode: dto.scheduled_at ? "SCHEDULED" : "INSTANT",
        restaurantZone: "zone-a",
        customerZone: "zone-a",
        addressLat: address.lat,
        addressLon: address.lon
      }
    });
    if (dto.items?.length) {
      await this.prisma.orderItem.createMany({
        data: dto.items.map((i) => ({
          orderId: order.id,
          name: i.name || i.product_id,
          quantity: i.quantity || 1,
          unitPrice: i.unit_price || 10
        }))
      });
    }
    await this.prisma.orderStatusEvent.create({
      data: { orderId: order.id, status: "CREATED" }
    });
    await this.queue.enqueueRisk(order.id);
    this.realtime.emitCustomerEvent(userId, "customer.order.updated", {
      order_id: order.id,
      status: order.status,
      current_eta: order.currentEta,
      eta_delta_minutes: order.etaDeltaMinutes
    });
    return order;
  }

  async getOrder(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, customerId: userId }
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async payOrder(userId: string, id: string, success: boolean) {
    const order = await this.getOrder(userId, id);
    const paymentStatus = success ? "PAID" : "FAILED";
    const nextStatus = success ? "PREPARING" : order.status;
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus, status: nextStatus }
    });
    await this.prisma.orderStatusEvent.create({
      data: { orderId: order.id, status: updated.status, actorUserId: userId }
    });
    await this.queue.enqueueRisk(order.id);
    this.realtime.emitCustomerEvent(userId, "customer.order.updated", {
      order_id: order.id,
      status: updated.status,
      current_eta: updated.currentEta,
      eta_delta_minutes: updated.etaDeltaMinutes
    });
    return updated;
  }

  async cancelOrder(userId: string, id: string) {
    const order = await this.getOrder(userId, id);
    if (order.status !== "CREATED" && order.status !== "PREPARING") {
      throw new BadRequestException("Cancel not allowed");
    }
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        refundStatus: order.paymentStatus === "PAID" ? "PENDING" : "NONE",
        paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus
      }
    });
    await this.prisma.orderStatusEvent.create({
      data: { orderId: order.id, status: updated.status, actorUserId: userId }
    });
    await this.prisma.auditLog.create({
      data: { actorUserId: userId, action: "CANCEL_ORDER", entityType: "order", entityId: order.id }
    });
    this.realtime.emitCustomerEvent(userId, "customer.order.updated", {
      order_id: order.id,
      status: updated.status,
      current_eta: updated.currentEta,
      eta_delta_minutes: updated.etaDeltaMinutes
    });
    return updated;
  }

  async getTracking(userId: string, id: string) {
    const order = await this.getOrder(userId, id);
    const alerts = await this.prisma.alert.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" }
    });
    const assignment = await this.prisma.courierAssignment.findFirst({
      where: { orderId: order.id },
      include: { courier: true }
    });
    const courier = assignment?.courier;
    const trafficSnapshot = await this.prisma.trafficSnapshot.findFirst({
      where: { geoScope: order.id },
      orderBy: { expiresAt: "desc" }
    });
    const weatherSnapshot = await this.prisma.weatherSnapshot.findFirst({
      where: { geoScope: order.id },
      orderBy: { expiresAt: "desc" }
    });
    let trafficUnavailable = true;
    let trafficSnapshotAgeMin: number | null = null;
    if (trafficSnapshot) {
      trafficUnavailable = trafficSnapshot.expiresAt < new Date();
      const ageMs = Date.now() - trafficSnapshot.expiresAt.getTime();
      trafficSnapshotAgeMin = Math.abs(Math.floor(ageMs / 60000));
    }
    const trafficPayload = (trafficSnapshot?.payload || {}) as Record<string, any>;
    const weatherPayload = (weatherSnapshot?.payload || {}) as Record<string, any>;
    return {
      order,
      map: {
        courierLocation: courier ? { lat: courier.currentLat, lon: courier.currentLon } : undefined,
        etaMinutes: order.currentEta
      },
      alerts,
      weather: weatherSnapshot
        ? {
            severity: weatherPayload.severity || "UNKNOWN",
            source: weatherSnapshot.source,
            expiresAt: weatherSnapshot.expiresAt,
            payload: weatherPayload
          }
        : null,
      traffic: trafficSnapshot
        ? {
            level: trafficPayload.level || "UNKNOWN",
            eta_normal_min: trafficPayload.eta_normal_min ?? null,
            eta_with_traffic_min: trafficPayload.eta_with_traffic_min ?? null,
            source: trafficSnapshot.source,
            expiresAt: trafficSnapshot.expiresAt
          }
        : null,
      trafficUnavailable,
      trafficSnapshotAgeMin
    };
  }

  async createIssue(userId: string, orderId: string, body: any) {
    const order = await this.getOrder(userId, orderId);
    const issue = await this.prisma.issueTicket.create({
      data: {
        orderId: order.id,
        customerId: userId,
        type: body?.type || "LATE",
        status: "OPEN"
      }
    });
    await this.prisma.alert.create({
      data: {
        orderId: order.id,
        type: "STOCK_RISK",
        severity: "LOW",
        isNew: true
      }
    });
    await this.prisma.notificationLog.create({
      data: {
        userId,
        orderId: order.id,
        alertType: "STOCK_RISK",
        channel: "IN_APP",
        status: "QUEUED"
      }
    });
    return issue;
  }

  async listIssues(userId: string, orderId: string) {
    return this.prisma.issueTicket.findMany({
      where: { orderId, customerId: userId }
    });
  }

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({ where: { userId } });
  }

  async addAddress(userId: string, body: any) {
    return this.prisma.address.create({
      data: {
        userId,
        label: body.label || "Address",
        line1: body.line1 || "",
        city: body.city || "",
        district: body.district || "",
        lat: Number(body.lat || 0),
        lon: Number(body.lon || 0)
      }
    });
  }
}
