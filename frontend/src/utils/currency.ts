import type { Currency } from '../types/expense';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
};

// Respaldo si no se puede traer el tipo de cambio (1 USD ≈ estos EUR).
export const FALLBACK_USD_TO_EUR = 0.92;

export function currencySymbol(currency: Currency | undefined): string {
  return CURRENCY_SYMBOLS[currency ?? 'USD'];
}

export function formatMoney(amount: number, currency: Currency): string {
  return `${CURRENCY_SYMBOLS[currency]}${amount.toFixed(2)}`;
}

// Convierte un monto de una moneda a otra usando el tipo USD->EUR.
export function convert(
  amount: number,
  from: Currency | undefined,
  to: Currency,
  usdToEur: number
): number {
  const fromCurrency = from ?? 'USD';
  const inUsd = fromCurrency === 'USD' ? amount : amount / usdToEur;
  return to === 'USD' ? inUsd : inUsd * usdToEur;
}
