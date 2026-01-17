import { Injectable } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";

@Injectable()
export class RealtimeService {
  constructor(private gateway: RealtimeGateway) {}

  emitCustomerEvent(userId: string, event: string, payload: any) {
    this.gateway.emitToCustomer(userId, event, payload);
  }

  emitOpsEvent(event: string, payload: any) {
    this.gateway.emitToOps(event, payload);
  }
}
