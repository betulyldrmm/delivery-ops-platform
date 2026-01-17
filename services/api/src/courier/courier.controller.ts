import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { CourierService } from "./courier.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("COURIER")
@Controller("courier")
export class CourierController {
  constructor(private courier: CourierService) {}

  @Get("orders")
  async listOrders(@Req() req: any) {
    return this.courier.listAssignedOrders(req.user.sub);
  }

  @Post("orders/:id/status")
  async updateStatus(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return this.courier.updateOrderStatus(req.user.sub, id, body.status);
  }

  @Post("me/location")
  async updateLocation(@Req() req: any, @Body() body: any) {
    return this.courier.updateMyLocation(req.user.sub, body);
  }
}
