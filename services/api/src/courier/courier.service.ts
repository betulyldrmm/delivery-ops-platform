import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { RealtimeService } from "../realtime/realtime.service";

@Injectable()
export class CourierService {
  private readonly allowedStatuses = new Set<OrderStatus>([
    OrderStatus.PICKED_UP,
    OrderStatus.ON_ROUTE,
    OrderStatus.DELIVERED
  ]);

  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private realtime: RealtimeService
  ) {}

  private async ensureCourier(userId: string) {
    return this.prisma.courier.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "Courier",
        currentLat: 41.02,
        currentLon: 29.0,
        isAvailable: true,
        capacity: 1
      }
    });
  }

  async listAssignedOrders(userId: string) {
    await this.ensureCourier(userId);
    const assignments = await this.prisma.courierAssignment.findMany({
      where: { courierId: userId, isActive: true, endedAt: null },
      include: { order: true },
      orderBy: { assignedAt: "desc" }
    });
    return assignments.map((assignment) => ({
      assignmentId: assignment.id,
      courierId: assignment.courierId,
      order: assignment.order
    }));
  }

  async updateOrderStatus(userId: string, orderId: string, status: string) {
    if (!this.allowedStatuses.has(status as OrderStatus)) {
      throw new BadRequestException("Invalid status for courier");
    }
    const assignment = await this.prisma.courierAssignment.findFirst({
      where: { courierId: userId, orderId, isActive: true, endedAt: null },
      include: { order: true }
    });
    if (!assignment) {
      throw new ForbiddenException("Order not assigned to courier");
    }
    const parsedStatus = status as OrderStatus;
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: parsedStatus }
    });
    await this.prisma.orderStatusEvent.create({
      data: { orderId, status: parsedStatus, actorUserId: userId }
    });
    if (parsedStatus === OrderStatus.DELIVERED) {
      await this.prisma.courierAssignment.update({
        where: { id: assignment.id },
        data: { isActive: false, endedAt: new Date() }
      });
      await this.prisma.courier.update({
        where: { id: userId },
        data: { isAvailable: true }
      });
    } else {
      await this.prisma.courier.update({
        where: { id: userId },
        data: { isAvailable: false }
      });
    }
    await this.queue.enqueueRisk(orderId);
    this.realtime.emitOpsEvent("ops.orders.updated", { order_id: orderId, status: parsedStatus });
    this.realtime.emitCustomerEvent(assignment.order.customerId, "customer.order.updated", {
      order_id: orderId,
      status: parsedStatus
    });
    return updated;
  }

  async updateMyLocation(userId: string, body: any) {
    const lat = Number(body?.lat);
    const lon = Number(body?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException("Invalid coordinates");
    }
    await this.ensureCourier(userId);
    try {
      return await this.prisma.courier.update({
        where: { id: userId },
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
}
