import { Module } from "@nestjs/common";
import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";
import { PrismaModule } from "../prisma/prisma.module";
import { QueueModule } from "../queue/queue.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [PrismaModule, QueueModule, RealtimeModule],
  controllers: [OpsController],
  providers: [OpsService]
})
export class OpsModule {}
