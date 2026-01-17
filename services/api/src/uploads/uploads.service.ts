import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { Client as MinioClient } from "minio";

@Injectable()
export class UploadsService {
  private minio: MinioClient;
  private bucket: string;

  constructor(private prisma: PrismaService, private queue: QueueService) {
    this.bucket = process.env.MINIO_BUCKET || "uploads";
    this.minio = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || "minio",
      secretKey: process.env.MINIO_SECRET_KEY || "minio123"
    });
  }

  async createBatch(file: any) {
    await this.ensureBucket();
    const objectName = `${Date.now()}-${file.originalname}`;
    await this.minio.putObject(this.bucket, objectName, file.buffer);
    const batch = await this.prisma.uploadBatch.create({
      data: {
        fileUrl: `minio://${this.bucket}/${objectName}`,
        status: "QUEUED",
        totalRows: 0,
        successRows: 0,
        failedRows: 0
      }
    });
    await this.queue.enqueueImport(batch.id);
    return batch;
  }

  async getBatch(id: string) {
    return this.prisma.uploadBatch.findUnique({ where: { id } });
  }

  private async ensureBucket() {
    const exists = await this.minio.bucketExists(this.bucket).catch(() => false);
    if (!exists) {
      await this.minio.makeBucket(this.bucket, "us-east-1");
    }
  }
}
