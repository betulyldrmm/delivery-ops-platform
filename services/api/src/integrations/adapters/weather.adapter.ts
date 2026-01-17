export class WeatherAdapter {
  async getWeather(lat: string, lon: string) {
    return {
      severity: "LOW",
      source: "stub",
      payload: { lat, lon },
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      cache_hit: false
    };
  }
}
