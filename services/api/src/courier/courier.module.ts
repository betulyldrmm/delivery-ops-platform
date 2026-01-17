import { Module } from "@nestjs/common";
import { CourierController } from "./courier.controller";
import { CourierService } from "./courier.service";
import { PrismaModule } from "../prisma/prisma.module";
import { QueueModule } from "../queue/queue.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [PrismaModule, QueueModule, RealtimeModule],
  controllers: [CourierController],
  providers: [CourierService]
})
export class CourierModule {}
