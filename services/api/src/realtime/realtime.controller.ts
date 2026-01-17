import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { RealtimeService } from "./realtime.service";

@Controller("internal/realtime")
export class RealtimeController {
  constructor(private realtime: RealtimeService) {}

  @Post("emit")
  async emit(@Headers("x-internal-secret") secret: string, @Body() body: any) {
    if (secret !== (process.env.API_INTERNAL_SECRET || "internal_secret")) {
      throw new UnauthorizedException();
    }
    if (body.room === "ops") {
      this.realtime.emitOpsEvent(body.event, body.payload);
    } else if (body.room && body.room.startsWith("customer:")) {
      const userId = body.room.replace("customer:", "");
      this.realtime.emitCustomerEvent(userId, body.event, body.payload);
    }
    return { ok: true };
  }
}
