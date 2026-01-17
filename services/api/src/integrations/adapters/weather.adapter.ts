function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return hash;
}

function seededFraction(seed: number) {
  return (seed % 1000) / 1000;
}

function pick<T>(items: T[], seed: number) {
  return items[seed % items.length];
}

export class WeatherAdapter {
  async getWeather(lat: string, lon: string) {
    const seed = hashSeed(`${lat || "0"}|${lon || "0"}`);
    const severity =
      seed % 10 >= 8 ? "HIGH" : seed % 10 >= 5 ? "MEDIUM" : "LOW";
    const conditions =
      severity === "HIGH"
        ? ["storm", "heavy_rain", "snow"]
        : severity === "MEDIUM"
          ? ["rain", "wind"]
          : ["clear", "cloudy"];
    const temperature = Math.round(5 + seededFraction(seed + 1) * 25);
    const windKph = Math.round(5 + seededFraction(seed + 2) * 40);
    const precipitation =
      severity === "LOW" ? 0 : Math.round(seededFraction(seed + 3) * 12);
    return {
      severity,
      source: "mock",
      payload: {
        lat,
        lon,
        severity,
        condition: pick(conditions, seed),
        temperature_c: temperature,
        wind_kph: windKph,
        precipitation_mm: precipitation
      },
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      cache_hit: false
    };
  }
}
