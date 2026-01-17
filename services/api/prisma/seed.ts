import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      { email: "customer@getir.test", role: "CUSTOMER", passwordHash: hash },
      { email: "courier@getir.test", role: "COURIER", passwordHash: hash },
      { email: "ops@getir.test", role: "OPS", passwordHash: hash },
      { email: "admin@getir.test", role: "ADMIN", passwordHash: hash }
    ],
    skipDuplicates: true
  });

  const customer = await prisma.user.findUnique({ where: { email: "customer@getir.test" } });
  const courierUser = await prisma.user.findUnique({ where: { email: "courier@getir.test" } });
  if (courierUser) {
    const existingCourier = await prisma.courier.findUnique({ where: { id: courierUser.id } });
    if (!existingCourier) {
      await prisma.courier.create({
        data: {
          id: courierUser.id,
          name: "Demo Courier",
          currentLat: 41.02,
          currentLon: 29.0,
          isAvailable: true,
          capacity: 1
        }
      });
    }
  }
  if (customer) {
    let address = await prisma.address.findFirst({ where: { userId: customer.id } });
    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: customer.id,
          label: "Ev",
          line1: "Demo Sokak",
          city: "Istanbul",
          district: "Kadikoy",
          lat: 40.99,
          lon: 29.03
        }
      });
    }

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: "CREATED",
        promisedEta: 25,
        currentEta: 25,
        etaDeltaMinutes: 0,
        riskScore: 0,
        deliveryMode: "INSTANT",
        restaurantZone: "zone-a",
        customerZone: "zone-a",
        addressLat: address.lat,
        addressLon: address.lon,
        paymentStatus: "PENDING",
        refundStatus: "NONE"
      }
    });

    await prisma.orderItem.create({
      data: { orderId: order.id, name: "Sut 1L", quantity: 1, unitPrice: 19.9 }
    });

    await prisma.orderStatusEvent.create({
      data: { orderId: order.id, status: "CREATED" }
    });
  }

  await prisma.inventory.createMany({
    data: [
      { productName: "Sut 1L", qty: 12 },
      { productName: "Su 1.5L", qty: 20 }
    ],
    skipDuplicates: true
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
