/**
 * Log transports configuration.
 *
 * Environment variables:
 *
 *   LOG_CONSOLE=true|false          Enable console transport (default: true)
 *   LOG_FILE=true|false             Enable file transports (default: true)
 *   LOG_FILE_DIR=logs               Directory for log files
 *   LOG_FILE_APP=app.log            Combined log filename
 *   LOG_FILE_ERROR=error.log        Error-only log filename
 *   LOG_FILE_MAX_SIZE=10485760      Max size per file in bytes (default 10MB)
 *   LOG_FILE_MAX_FILES=10           Max rotated files
 *   LOG_FILE_ERROR_MAX_SIZE=5242880 Max size for error file (default 5MB)
 *   LOG_FILE_ERROR_MAX_FILES=5
 *
 *   LOG_HTTP_URL=                   Optional: POST logs to an HTTP endpoint
 *   LOG_HTTP_LEVEL=warn             Min level for HTTP transport
 *
 *   LOG_SILENT=true                 Disable all transports (tests)
 */

export interface FileTransportOptions {
  enabled: boolean;
  dir: string;
  appFilename: string;
  errorFilename: string;
  maxSize: number;
  maxFiles: number;
  errorMaxSize: number;
  errorMaxFiles: number;
}

export interface HttpTransportOptions {
  enabled: boolean;
  url: string;
  level: string;
}

export interface TransportsConfig {
  console: boolean;
  file: FileTransportOptions;
  http: HttpTransportOptions;
  silent: boolean;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return defaultValue;
  return v === '1' || v.toLowerCase() === 'true' || v === 'yes';
}

function envInt(key: string, defaultValue: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

export function getTransportsConfig(): TransportsConfig {
  const httpUrl = process.env.LOG_HTTP_URL || '';

  return {
    console: envBool('LOG_CONSOLE', true),
    file: {
      enabled: envBool('LOG_FILE', true),
      dir: process.env.LOG_FILE_DIR || 'logs',
      appFilename: process.env.LOG_FILE_APP || 'app.log',
      errorFilename: process.env.LOG_FILE_ERROR || 'error.log',
      maxSize: envInt('LOG_FILE_MAX_SIZE', 10 * 1024 * 1024),
      maxFiles: envInt('LOG_FILE_MAX_FILES', 10),
      errorMaxSize: envInt('LOG_FILE_ERROR_MAX_SIZE', 5 * 1024 * 1024),
      errorMaxFiles: envInt('LOG_FILE_ERROR_MAX_FILES', 5),
    },
    http: {
      enabled: Boolean(httpUrl),
      url: httpUrl,
      level: process.env.LOG_HTTP_LEVEL || 'warn',
    },
    silent: envBool('LOG_SILENT', false),
  };
}
