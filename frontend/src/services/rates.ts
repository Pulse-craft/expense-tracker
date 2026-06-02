import { FALLBACK_USD_TO_EUR } from '../utils/currency';

// Cuántos EUR equivalen a 1 USD (ej. 0.92). Usa respaldo si la API falla.
export async function getUsdToEurRate(): Promise<number> {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
    if (!response.ok) {
      return FALLBACK_USD_TO_EUR;
    }
    const data = await response.json();
    const rate = data?.rates?.EUR;
    return typeof rate === 'number' && rate > 0 ? rate : FALLBACK_USD_TO_EUR;
  } catch {
    return FALLBACK_USD_TO_EUR;
  }
}
