import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { OpsService } from "./ops.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("OPS", "ADMIN")
@Controller("ops")
export class OpsController {
  constructor(private ops: OpsService) {}

  @Get("dashboard")
  async dashboard() {
    return this.ops.getDashboard();
  }

  @Get("orders")
  async listOrders(@Query() query: any) {
    return this.ops.listOrders(query);
  }

  @Get("orders/:id")
  async getOrder(@Param("id") id: string) {
    return this.ops.getOrder(id);
  }

  @Post("orders/:id/status")
  async updateStatus(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.ops.updateStatus(req.user.sub, id, body.status);
  }

  @Post("orders/:id/assign-courier")
  async assignCourier(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.ops.assignCourier(req.user.sub, id, body.courier_id);
  }

  @Post("orders/:id/notify-customer")
  async notifyCustomer(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.ops.notifyCustomer(req.user.sub, id, body);
  }

  @Roles("ADMIN")
  @Post("orders/:id/override-eta")
  async overrideEta(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.ops.overrideEta(req.user.sub, id, body);
  }

  @Get("map")
  async getMap() {
    return this.ops.getMap();
  }

  @Post("couriers/:id/location")
  async updateCourierLocation(@Param("id") id: string, @Body() body: any) {
    return this.ops.updateCourierLocation(id, body);
  }

  @Get("inventory")
  async listInventory() {
    return this.ops.listInventory();
  }

  @Patch("inventory/:id")
  async updateInventory(@Param("id") id: string, @Body() body: any) {
    return this.ops.updateInventory(id, body.qty);
  }

  @Get("reports")
  async getReports(@Query() query: any) {
    return this.ops.getReports(query);
  }

  @Get("admin/users")
  @Roles("ADMIN")
  async listUsers() {
    return this.ops.listUsers();
  }

  @Post("admin/roles")
  @Roles("ADMIN")
  async updateRole(@Body() body: any) {
    return this.ops.updateRole(body.user_id, body.role);
  }

  @Get("audit-logs")
  @Roles("ADMIN")
  async getAuditLogs(@Query("order_id") orderId?: string) {
    return this.ops.getAuditLogs(orderId);
  }
}
