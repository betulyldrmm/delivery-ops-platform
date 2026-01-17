CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'OPS', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PREPARING', 'READY', 'ASSIGNED', 'ON_ROUTE', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING', 'CREDIT_ISSUED');
CREATE TYPE "DeliveryMode" AS ENUM ('INSTANT', 'SCHEDULED');
CREATE TYPE "AlertType" AS ENUM ('DELAY_RISK', 'WEATHER_RISK', 'STOCK_RISK');
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "IssueType" AS ENUM ('MISSING', 'DAMAGED', 'LATE');
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'IN_APP', 'SMS', 'EMAIL');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');
CREATE TYPE "UploadStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role "Role" NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Address" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id),
  label TEXT NOT NULL,
  line1 TEXT,
  city TEXT,
  district TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL
);

CREATE TABLE "Order" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" UUID NOT NULL REFERENCES "User"(id),
  status "OrderStatus" NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "promisedEta" INTEGER NOT NULL,
  "currentEta" INTEGER NOT NULL,
  "etaDeltaMinutes" INTEGER NOT NULL,
  "riskScore" DOUBLE PRECISION NOT NULL,
  "riskReasons" JSONB,
  "deliveryMode" "DeliveryMode" NOT NULL,
  "restaurantZone" TEXT NOT NULL,
  "customerZone" TEXT NOT NULL,
  "addressLat" DOUBLE PRECISION NOT NULL,
  "addressLon" DOUBLE PRECISION NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL,
  "refundStatus" "RefundStatus" NOT NULL,
  "externalId" TEXT UNIQUE
);

CREATE TABLE "OrderItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "OrderStatusEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id),
  status "OrderStatus" NOT NULL,
  "actorUserId" UUID,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Courier" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "currentLat" DOUBLE PRECISION NOT NULL,
  "currentLon" DOUBLE PRECISION NOT NULL,
  "isAvailable" BOOLEAN NOT NULL,
  capacity INTEGER NOT NULL,
  "lastHeartbeatAt" TIMESTAMP
);

CREATE TABLE "CourierAssignment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id),
  "courierId" UUID NOT NULL REFERENCES "Courier"(id),
  "assignedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Alert" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type "AlertType" NOT NULL,
  severity "AlertSeverity" NOT NULL,
  "orderId" UUID NOT NULL REFERENCES "Order"(id),
  "isNew" BOOLEAN NOT NULL,
  "acknowledgedBy" UUID,
  reason TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "NotificationLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  "orderId" UUID,
  "alertType" TEXT,
  channel "NotificationChannel" NOT NULL,
  status "NotificationStatus" NOT NULL,
  "sentAt" TIMESTAMP,
  "providerResponse" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "UploadBatch" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fileUrl" TEXT NOT NULL,
  status "UploadStatus" NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "successRows" INTEGER NOT NULL,
  "failedRows" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "UploadRow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "uploadBatchId" UUID NOT NULL REFERENCES "UploadBatch"(id),
  "rawRow" JSONB NOT NULL,
  "normalizedRow" JSONB,
  error TEXT,
  "orderExternalId" TEXT UNIQUE,
  "orderId" UUID,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "TrafficSnapshot" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "geoScope" TEXT NOT NULL
);

CREATE TABLE "WeatherSnapshot" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "geoScope" TEXT NOT NULL
);

CREATE TABLE "Inventory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productName" TEXT NOT NULL,
  qty INTEGER NOT NULL
);

CREATE TABLE "AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" UUID,
  action TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "IssueTicket" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id),
  "customerId" UUID NOT NULL REFERENCES "User"(id),
  type "IssueType" NOT NULL,
  status "IssueStatus" NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
