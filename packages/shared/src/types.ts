export type Role = "CUSTOMER" | "COURIER" | "OPS" | "ADMIN";
export type OrderStatus =
  | "CREATED"
  | "PREPARING"
  | "READY"
  | "ASSIGNED"
  | "PICKED_UP"
  | "ON_ROUTE"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type RefundStatus = "NONE" | "PENDING" | "CREDIT_ISSUED";
export type AlertType = "DELAY_RISK" | "WEATHER_RISK" | "TRAFFIC_RISK" | "STOCK_RISK";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: string;
  role: Role;
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  promisedEta: number;
  currentEta: number;
  etaDeltaMinutes: number;
  riskScore: number;
  riskReasons?: Record<string, unknown> | null;
  paymentStatus: PaymentStatus;
  refundStatus: RefundStatus;
  customerZone?: string | null;
  restaurantZone?: string | null;
  addressLat?: number | null;
  addressLon?: number | null;
}

export interface Alert {
  id: string;
  orderId: string;
  type: AlertType;
  severity: AlertSeverity;
  isNew: boolean;
  createdAt: string;
}

export interface TrackingResponse {
  order: Order;
  map: {
    courierLocation?: { lat: number; lon: number };
    routePolyline?: string;
    etaMinutes?: number;
  };
  alerts: Alert[];
  weather?: {
    severity: string;
    source?: string;
    expiresAt?: string;
    payload?: Record<string, unknown>;
  } | null;
  traffic?: {
    level: string;
    eta_normal_min?: number | null;
    eta_with_traffic_min?: number | null;
    source?: string;
    expiresAt?: string;
  } | null;
  trafficUnavailable?: boolean;
  trafficSnapshotAgeMin?: number;
}
