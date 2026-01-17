import { Injectable } from "@nestjs/common";
import { TrafficAdapter } from "./adapters/traffic.adapter";
import { WeatherAdapter } from "./adapters/weather.adapter";
import { MapEtaAdapter } from "./adapters/map-eta.adapter";

@Injectable()
export class IntegrationsService {
  private traffic: TrafficAdapter;
  private weather: WeatherAdapter;
  private mapEta: MapEtaAdapter;

  constructor() {
    this.traffic = new TrafficAdapter();
    this.weather = new WeatherAdapter();
    this.mapEta = new MapEtaAdapter();
  }

  async getTraffic(origin: string, destination: string) {
    try {
      return await this.traffic.getRoute(origin, destination);
    } catch (e) {
      return {
        eta_normal_min: 20,
        eta_with_traffic_min: null,
        source: "unavailable",
        expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
        cache_hit: true
      };
    }
  }

  async getWeather(lat: string, lon: string) {
    try {
      return await this.weather.getWeather(lat, lon);
    } catch (e) {
      return {
        severity: "UNKNOWN",
        source: "unavailable",
        payload: { lat, lon },
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        cache_hit: true
      };
    }
  }

  async getRoute(origin: string, destination: string) {
    return this.mapEta.getRoute(origin, destination);
  }
}
