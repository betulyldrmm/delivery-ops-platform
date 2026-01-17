import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({ cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers["authorization"] ||
      "";
    const raw = String(token).replace("Bearer ", "");
    try {
      const payload: any = this.jwt.verify(raw, {
        secret: process.env.JWT_SECRET || "dev_secret"
      });
      if (payload.role === "CUSTOMER") {
        client.join(`customer:${payload.sub}`);
      } else {
        client.join("ops:global");
      }
    } catch (e) {
      client.disconnect();
    }
  }

  emitToCustomer(userId: string, event: string, payload: any) {
    this.server.to(`customer:${userId}`).emit(event, payload);
  }

  emitToOps(event: string, payload: any) {
    this.server.to("ops:global").emit(event, payload);
  }
}
