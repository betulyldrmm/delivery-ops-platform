import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";
import { RealtimeController } from "./realtime.controller";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret"
    })
  ],
  providers: [RealtimeGateway, RealtimeService],
  controllers: [RealtimeController],
  exports: [RealtimeService]
})
export class RealtimeModule {}
