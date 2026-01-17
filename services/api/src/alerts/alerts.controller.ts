import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AlertsService } from "./alerts.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get("alerts")
  async customerAlerts(@Req() req: any) {
    return this.alerts.getCustomerAlerts(req.user.sub);
  }

  @Roles("OPS", "ADMIN")
  @Get("ops/alerts")
  async opsAlerts(@Query() query: any) {
    return this.alerts.getOpsAlerts(query);
  }

  @Roles("OPS", "ADMIN")
  @Post("ops/alerts/:id/ack")
  async ack(@Req() req: any, @Param("id") id: string) {
    return this.alerts.ackAlert(req.user.sub, id);
  }
}
