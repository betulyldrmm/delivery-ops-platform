import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queue/queue.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { AuthModule } from "./auth/auth.module";
import { OrdersModule } from "./orders/orders.module";
import { OpsModule } from "./ops/ops.module";
import { AlertsModule } from "./alerts/alerts.module";
import { UploadsModule } from "./uploads/uploads.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { HealthModule } from "./health/health.module";
import { CatalogModule } from "./catalog/catalog.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    QueueModule,
    RealtimeModule,
    AuthModule,
    OrdersModule,
    OpsModule,
    AlertsModule,
    UploadsModule,
    IntegrationsModule,
    HealthModule,
    CatalogModule
  ]
})
export class AppModule {}
