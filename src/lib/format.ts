export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercentage(value: number): string {
  return value.toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 1 });
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
