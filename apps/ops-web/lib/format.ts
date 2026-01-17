export function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2
  }).format(value);
}

export function formatRelativeTime(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(diffSeconds)) return "-";
  if (diffSeconds < 60) return `${diffSeconds} sn önce`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}
