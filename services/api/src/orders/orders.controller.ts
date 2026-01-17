import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("CUSTOMER")
@Controller("customer")
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get("orders")
  async listOrders(@Req() req: any, @Query("limit") limit?: string) {
    return this.orders.listOrders(req.user.sub, Number(limit) || 20);
  }

  @Post("orders")
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(req.user.sub, dto);
  }

  @Get("orders/:id")
  async getOrder(@Req() req: any, @Param("id") id: string) {
    return this.orders.getOrder(req.user.sub, id);
  }

  @Post("orders/:id/pay")
  async payOrder(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.orders.payOrder(req.user.sub, id, body?.success !== false);
  }

  @Post("orders/:id/cancel")
  async cancelOrder(@Req() req: any, @Param("id") id: string) {
    return this.orders.cancelOrder(req.user.sub, id);
  }

  @Get("orders/:id/tracking")
  async getTracking(@Req() req: any, @Param("id") id: string) {
    return this.orders.getTracking(req.user.sub, id);
  }

  @Post("orders/:id/issues")
  async createIssue(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.orders.createIssue(req.user.sub, id, body);
  }

  @Get("orders/:id/issues")
  async listIssues(@Req() req: any, @Param("id") id: string) {
    return this.orders.listIssues(req.user.sub, id);
  }

  @Get("addresses")
  async listAddresses(@Req() req: any) {
    return this.orders.listAddresses(req.user.sub);
  }

  @Post("addresses")
  async addAddress(@Req() req: any, @Body() body: any) {
    return this.orders.addAddress(req.user.sub, body);
  }
}
