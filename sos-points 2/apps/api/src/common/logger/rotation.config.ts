/**
 * Log file rotation configuration.
 *
 * Two strategies (can be combined via env):
 *
 * 1) Size-based (built-in winston File transport)
 *    LOG_ROTATE_MAX_SIZE=10m
 *    LOG_ROTATE_MAX_FILES=10
 *
 * 2) Date-based (winston-daily-rotate-file)
 *    LOG_ROTATE_DAILY=true
 *    LOG_ROTATE_DATE_PATTERN=YYYY-MM-DD
 *    LOG_ROTATE_MAX_FILES=14d          (keep 14 days)
 *    LOG_ROTATE_MAX_SIZE=20m          (also rotate within the day if huge)
 *    LOG_ROTATE_ZIP=true              (compress old files .gz)
 *
 * Examples of resulting files (daily):
 *   logs/app-2026-09-16.log
 *   logs/app-2026-09-15.log.gz
 *   logs/error-2026-09-16.log
 */

export interface RotationConfig {
  /** Use winston-daily-rotate-file instead of plain File */
  daily: boolean;
  /** Date pattern for daily rotate (e.g. YYYY-MM-DD) */
  datePattern: string;
  /** Max size before rotate within same day / size-based (e.g. "10m", "20m") */
  maxSize: string;
  /** How many files or days to keep (e.g. "10", "14d") */
  maxFiles: string;
  /** Max size for error log */
  errorMaxSize: string;
  /** Max files/days for error log */
  errorMaxFiles: string;
  /** Compress rotated files with gzip */
  zip: boolean;
  /** Directory */
  dir: string;
  /** Base filename for app logs (without date) */
  appFilename: string;
  /** Base filename for error logs */
  errorFilename: string;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return defaultValue;
  return v === '1' || v.toLowerCase() === 'true' || v === 'yes';
}

export function getRotationConfig(): RotationConfig {
  return {
    daily: envBool('LOG_ROTATE_DAILY', true),
    datePattern: process.env.LOG_ROTATE_DATE_PATTERN || 'YYYY-MM-DD',
    maxSize: process.env.LOG_ROTATE_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_ROTATE_MAX_FILES || '14d',
    errorMaxSize: process.env.LOG_ROTATE_ERROR_MAX_SIZE || '10m',
    errorMaxFiles: process.env.LOG_ROTATE_ERROR_MAX_FILES || '30d',
    zip: envBool('LOG_ROTATE_ZIP', true),
    dir: process.env.LOG_FILE_DIR || 'logs',
    appFilename: process.env.LOG_FILE_APP || 'app-%DATE%.log',
    errorFilename: process.env.LOG_FILE_ERROR || 'error-%DATE%.log',
  };
}

/**
 * Parse size strings like "10m", "5m", "100k" into bytes (for non-daily transport).
 */
export function parseSizeToBytes(size: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(k|m|g)?$/i.exec(size.trim());
  if (!match) return 10 * 1024 * 1024;
  const n = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'g') return Math.round(n * 1024 * 1024 * 1024);
  if (unit === 'm') return Math.round(n * 1024 * 1024);
  if (unit === 'k') return Math.round(n * 1024);
  return Math.round(n);
}

/**
 * Parse maxFiles for size-based transport (number only).
 * "14d" → 14, "10" → 10
 */
export function parseMaxFilesCount(value: string): number {
  const match = /^(\d+)/.exec(value);
  return match ? parseInt(match[1], 10) : 10;
}
