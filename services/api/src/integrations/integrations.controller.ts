import { Controller, Get, Query } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
export class IntegrationsController {
  constructor(private integrations: IntegrationsService) {}

  @Get("traffic")
  async traffic(@Query("origin") origin: string, @Query("destination") destination: string) {
    return this.integrations.getTraffic(origin, destination);
  }

  @Get("weather")
  async weather(@Query("lat") lat: string, @Query("lon") lon: string) {
    return this.integrations.getWeather(lat, lon);
  }
}
