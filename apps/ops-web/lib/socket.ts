import { io } from "socket.io-client";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const SOCKET_URL = API_URL.replace("/api", "");

export function connectSocket() {
  const token = getToken();
  return io(SOCKET_URL, { auth: { token } });
}
