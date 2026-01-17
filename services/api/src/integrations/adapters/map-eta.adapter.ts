export class MapEtaAdapter {
  async getRoute(origin: string, destination: string) {
    return { distance_m: 2000, eta_min: 20, polyline: "" };
  }
}
