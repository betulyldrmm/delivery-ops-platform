import { Controller, Get, Query } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
export class IntegrationsController {
  constructor(private integrations: IntegrationsService) {}

  @Get("traffic")
  async traffic(
    @Query("origin") origin: string,
    @Query("destination") destination: string,
    @Query("dest") dest: string
  ) {
    return this.integrations.getTraffic(origin, destination || dest);
  }

  @Get("weather")
  async weather(@Query("lat") lat: string, @Query("lon") lon: string, @Query("lng") lng: string) {
    return this.integrations.getWeather(lat, lon || lng);
  }
}
