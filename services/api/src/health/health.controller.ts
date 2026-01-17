import { Controller, Get } from "@nestjs/common";
import IORedis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async health() {
    const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    const redisStart = Date.now();
    await redis.ping();
    const redisLatency = Date.now() - redisStart;
    const heartbeat = await redis.get("worker:heartbeat");
    return {
      db: { status: "ok", latency_ms: dbLatency },
      redis: { status: "ok", latency_ms: redisLatency },
      worker: { status: heartbeat ? "ok" : "missing", last_heartbeat_at: heartbeat },
      timestamp: new Date().toISOString()
    };
  }
}
