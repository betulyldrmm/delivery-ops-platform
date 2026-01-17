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

export class TrafficAdapter {
  async getRoute(origin: string, destination: string) {
    const seed = hashSeed(`${origin || "unknown"}|${destination || "unknown"}`);
    const etaNormal = 18 + (seed % 15);
    const factor = 1 + seededFraction(seed + 7) * 0.8;
    const etaWithTraffic = Math.max(etaNormal, Math.round(etaNormal * factor));
    const level = factor >= 1.5 ? "HIGH" : factor >= 1.25 ? "MEDIUM" : "LOW";
    return {
      eta_normal_min: etaNormal,
      eta_with_traffic_min: etaWithTraffic,
      level,
      source: "mock",
      expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
      cache_hit: false
    };
  }
}
