import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getCustomerAlerts(userId: string) {
    const orders = await this.prisma.order.findMany({ where: { customerId: userId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    return this.prisma.alert.findMany({ where: { orderId: { in: orderIds } }, orderBy: { createdAt: "desc" } });
  }

  async getOpsAlerts(query: any) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.severity) where.severity = query.severity;
    if (query.is_new) where.isNew = query.is_new === "true";
    return this.prisma.alert.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async ackAlert(actorId: string, id: string) {
    return this.prisma.alert.update({ where: { id }, data: { isNew: false, acknowledgedBy: actorId } });
  }
}
