export class TrafficAdapter {
  async getRoute(origin: string, destination: string) {
    return {
      eta_normal_min: 20,
      eta_with_traffic_min: 30,
      source: "stub",
      expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
      cache_hit: false
    };
  }
}
