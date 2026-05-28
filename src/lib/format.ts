export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(window: string): string {
  const map: Record<string, string> = {
    morning: "8–11am",
    afternoon: "11am–3pm",
    evening: "3–6pm",
  };
  return map[window] ?? window;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}
