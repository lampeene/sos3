/**
 * Central configuration for log formatting.
 * Controlled via environment variables.
 *
 * LOG_LEVEL=info|warn|error|debug|verbose
 * LOG_FORMAT=json|pretty|compact
 * LOG_TIMESTAMP=iso|epoch|simple
 * LOG_COLOR=true|false
 * LOG_STACK=true|false
 * LOG_META=true|false
 */

export type LogFormat = 'json' | 'pretty' | 'compact';
export type TimestampFormat = 'iso' | 'epoch' | 'simple';

export interface LogFormatOptions {
  format: LogFormat;
  level: string;
  timestamp: TimestampFormat;
  color: boolean;
  includeStack: boolean;
  includeMeta: boolean;
  service: string;
  env: string;
  version: string;
  /** Fields always omitted from output (noise reduction) */
  omitFields: string[];
  /** Max length for message truncation (0 = no limit) */
  maxMessageLength: number;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return defaultValue;
  return v === '1' || v.toLowerCase() === 'true' || v === 'yes';
}

function envString<T extends string>(key: string, allowed: T[], fallback: T): T {
  const v = process.env[key] as T | undefined;
  if (v && allowed.includes(v)) return v;
  return fallback;
}

export function getLogFormatOptions(): LogFormatOptions {
  const isProd = process.env.NODE_ENV === 'production';

  // Default format: pretty in dev, json in prod
  const defaultFormat: LogFormat = isProd ? 'json' : 'pretty';

  return {
    format: envString('LOG_FORMAT', ['json', 'pretty', 'compact'], defaultFormat),
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    timestamp: envString('LOG_TIMESTAMP', ['iso', 'epoch', 'simple'], 'iso'),
    color: envBool('LOG_COLOR', !isProd),
    includeStack: envBool('LOG_STACK', true),
    includeMeta: envBool('LOG_META', true),
    service: process.env.LOG_SERVICE || 'sos-points-api',
    env: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '2.0.0',
    omitFields: (process.env.LOG_OMIT_FIELDS || 'splat,Symbol(level)')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    maxMessageLength: Number(process.env.LOG_MAX_MESSAGE_LENGTH || 0) || 0,
  };
}

/**
 * Format a timestamp according to config.
 */
export function formatTimestamp(
  mode: TimestampFormat,
  date: Date = new Date(),
): string | number {
  switch (mode) {
    case 'epoch':
      return date.getTime();
    case 'simple':
      // YYYY-MM-DD HH:mm:ss
      return date.toISOString().replace('T', ' ').slice(0, 19);
    case 'iso':
    default:
      return date.toISOString();
  }
}
