import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface AppConfig {
  nombre?: string;
  slogan?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  ruc?: string;
  moneda: string;       // código ISO: USD, COP, MXN, PEN, ARS, etc.
  simbolo: string;      // símbolo: $, S/, etc.
  impuestoPct: number;  // e.g. 16
  diasGarantiaDefault?: number;
}

const SIMBOLOS: Record<string, string> = {
  USD: '$', COP: '$', MXN: '$', PEN: 'S/', ARS: '$',
  BRL: 'R$', CLP: '$', BOB: 'Bs', GTQ: 'Q', HNL: 'L',
  NIO: 'C$', PAB: 'B/.', PYG: '₲', DOP: 'RD$', VES: 'Bs.S',
};

const LOCALES: Record<string, string> = {
  USD: 'en-US', COP: 'es-CO', MXN: 'es-MX', PEN: 'es-PE',
  ARS: 'es-AR', BRL: 'pt-BR', CLP: 'es-CL', BOB: 'es-BO',
  GTQ: 'es-GT', HNL: 'es-HN', NIO: 'es-NI', PAB: 'es-PA',
  PYG: 'es-PY', DOP: 'es-DO', VES: 'es-VE',
};

const DEFAULT_CONFIG: AppConfig = {
  moneda: 'USD', simbolo: '$', impuestoPct: 0,
};

export function useConfig(): AppConfig {
  const { data } = useQuery<any>({
    queryKey: ['config'],
    queryFn: () => api.get('/config').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return DEFAULT_CONFIG;

  const moneda: string = data.moneda ?? 'USD';
  const simbolo = SIMBOLOS[moneda] ?? moneda;

  return {
    ...data,
    moneda,
    simbolo,
    impuestoPct: Number(data.impuestoPct ?? data.ivaPorcentaje ?? 0),
  };
}

export function formatMonto(valor: number | string, config: AppConfig): string {
  const num = Number(valor);
  if (isNaN(num)) return `${config.simbolo}0.00`;

  const locale = LOCALES[config.moneda] ?? 'es-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${config.simbolo}${num.toFixed(2)}`;
  }
}
