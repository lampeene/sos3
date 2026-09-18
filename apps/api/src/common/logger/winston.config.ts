import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { getRequestId, getRequestContext } from '../context/request-context';
import {
  getLogFormatOptions,
  formatTimestamp,
  LogFormatOptions,
} from './log-format.config';
import { getTransportsConfig, TransportsConfig } from './transports.config';
import {
  getRotationConfig,
  parseSizeToBytes,
  parseMaxFilesCount,
  RotationConfig,
} from './rotation.config';
import { getElkConfig } from './elk.config';

const formatOpts: LogFormatOptions = getLogFormatOptions();
const transportOpts: TransportsConfig = getTransportsConfig();
const rotationOpts: RotationConfig = getRotationConfig();
const elkOpts = getElkConfig();

if (transportOpts.file.enabled && !transportOpts.silent) {
  const dir = path.resolve(rotationOpts.dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const enrichFormat = winston.format((info) => {
  const requestId = getRequestId();
  const ctx = getRequestContext();

  if (requestId) info.requestId = requestId;
  if (ctx?.userId) info.userId = ctx.userId;
  if (ctx?.method) info.httpMethod = ctx.method;
  if (ctx?.path) info.httpPath = ctx.path;
  info.severity = info.level;

  if (
    formatOpts.maxMessageLength > 0 &&
    typeof info.message === 'string' &&
    info.message.length > formatOpts.maxMessageLength
  ) {
    info.message =
      info.message.slice(0, formatOpts.maxMessageLength) + '…[truncated]';
  }

  for (const field of formatOpts.omitFields) {
    delete (info as any)[field];
  }

  return info;
});

const jsonFormat = winston.format.combine(
  enrichFormat(),
  winston.format.timestamp({
    format: () => String(formatTimestamp(formatOpts.timestamp)),
  }),
  formatOpts.includeStack
    ? winston.format.errors({ stack: true })
    : winston.format.errors({ stack: false }),
  winston.format.json(),
);

const prettyFormat = winston.format.combine(
  enrichFormat(),
  winston.format.timestamp({
    format: () =>
      String(
        formatTimestamp(
          formatOpts.timestamp === 'iso' ? 'simple' : formatOpts.timestamp,
        ),
      ),
  }),
  formatOpts.includeStack
    ? winston.format.errors({ stack: true })
    : winston.format.errors({ stack: false }),
  formatOpts.color
    ? winston.format.colorize({ all: true })
    : winston.format.uncolorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, requestId, stack, ...meta } =
      info;
    const ctx = context ? `[${context}]` : '';
    const rid = requestId ? `[${String(requestId).slice(0, 8)}]` : '';

    let extraStr = '';
    if (formatOpts.includeMeta) {
      const skip = new Set([
        'service', 'env', 'version', 'userId', 'httpMethod', 'httpPath',
        'severity', 'splat',
      ]);
      const extra: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(meta)) {
        if (!skip.has(k) && v !== undefined) extra[k] = v;
      }
      if (Object.keys(extra).length) {
        extraStr = ` ${JSON.stringify(extra)}`;
      }
    }

    const stackStr = stack && formatOpts.includeStack ? `\n${stack}` : '';
    return `${timestamp} ${level} ${rid}${ctx} ${message}${extraStr}${stackStr}`;
  }),
);

const compactFormat = winston.format.combine(
  enrichFormat(),
  winston.format.timestamp({
    format: () => String(formatTimestamp(formatOpts.timestamp)),
  }),
  formatOpts.includeStack
    ? winston.format.errors({ stack: true })
    : winston.format.errors({ stack: false }),
  winston.format.printf((info) => {
    const parts: string[] = [];
    parts.push(`time=${info.timestamp}`);
    parts.push(`level=${info.level}`);
    if (info.requestId) parts.push(`requestId=${info.requestId}`);
    if (info.context) parts.push(`context=${info.context}`);
    parts.push(`msg="${String(info.message).replace(/"/g, '\\"')}"`);

    if (formatOpts.includeMeta) {
      const skip = new Set([
        'timestamp', 'level', 'message', 'context', 'requestId',
        'service', 'env', 'version', 'severity', 'splat', 'stack',
      ]);
      for (const [k, v] of Object.entries(info)) {
        if (skip.has(k) || v === undefined) continue;
        if (typeof v === 'string') {
          parts.push(`${k}="${String(v).replace(/"/g, '\\"')}"`);
        } else if (typeof v === 'number' || typeof v === 'boolean') {
          parts.push(`${k}=${v}`);
        } else {
          parts.push(`${k}=${JSON.stringify(v)}`);
        }
      }
    }

    return parts.join(' ');
  }),
);

function resolveConsoleFormat() {
  switch (formatOpts.format) {
    case 'json':
      return jsonFormat;
    case 'compact':
      return compactFormat;
    default:
      return prettyFormat;
  }
}

function createFileTransports(): winston.transport[] {
  const transports: winston.transport[] = [];
  const dir = rotationOpts.dir;

  if (rotationOpts.daily) {
    // ----- Daily rotate (recommended) -----
    const appRotate = new DailyRotateFile({
      dirname: dir,
      filename: rotationOpts.appFilename.includes('%DATE%')
        ? rotationOpts.appFilename
        : 'app-%DATE%.log',
      datePattern: rotationOpts.datePattern,
      zippedArchive: rotationOpts.zip,
      maxSize: rotationOpts.maxSize,
      maxFiles: rotationOpts.maxFiles,
      format: jsonFormat,
      auditFile: path.join(dir, '.app-audit.json'),
    });

    const errorRotate = new DailyRotateFile({
      dirname: dir,
      filename: rotationOpts.errorFilename.includes('%DATE%')
        ? rotationOpts.errorFilename
        : 'error-%DATE%.log',
      datePattern: rotationOpts.datePattern,
      zippedArchive: rotationOpts.zip,
      maxSize: rotationOpts.errorMaxSize,
      maxFiles: rotationOpts.errorMaxFiles,
      level: 'error',
      format: jsonFormat,
      auditFile: path.join(dir, '.error-audit.json'),
    });

    // Optional: log rotation events
    appRotate.on('rotate', (oldFilename, newFilename) => {
      // Use console to avoid recursion
      console.log(
        JSON.stringify({
          level: 'info',
          message: 'log.rotate',
          event: 'log.rotate',
          type: 'app',
          oldFilename,
          newFilename,
          timestamp: new Date().toISOString(),
        }),
      );
    });

    transports.push(errorRotate, appRotate);
  } else {
    // ----- Size-based only (classic winston File) -----
    transports.push(
      new winston.transports.File({
        filename: path.join(dir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: parseSizeToBytes(rotationOpts.errorMaxSize),
        maxFiles: parseMaxFilesCount(rotationOpts.errorMaxFiles),
        tailable: true,
      }),
      new winston.transports.File({
        filename: path.join(dir, 'app.log'),
        format: jsonFormat,
        maxsize: parseSizeToBytes(rotationOpts.maxSize),
        maxFiles: parseMaxFilesCount(rotationOpts.maxFiles),
        tailable: true,
      }),
    );
  }

  return transports;
}

function parseHttpTransport(urlStr: string): Record<string, unknown> {
  try {
    const u = new URL(urlStr);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80,
      path: u.pathname + u.search,
      ssl: u.protocol === 'https:',
    };
  } catch {
    return { host: 'localhost', port: 80, path: '/', ssl: false };
  }
}

function buildTransports(): winston.transport[] {
  if (transportOpts.silent) {
    return [new winston.transports.Console({ silent: true })];
  }

  const transports: winston.transport[] = [];

  if (transportOpts.console) {
    transports.push(
      new winston.transports.Console({
        format: resolveConsoleFormat(),
      }),
    );
  }

  if (transportOpts.file.enabled) {
    transports.push(...createFileTransports());
  }

  if (transportOpts.http.enabled && transportOpts.http.url) {
    transports.push(
      new winston.transports.Http({
        format: jsonFormat,
        level: transportOpts.http.level,
        ...parseHttpTransport(transportOpts.http.url),
      } as any),
    );
  }

  // ELK: HTTP → Logstash
  if (elkOpts.enabled && elkOpts.mode === 'http' && elkOpts.http.url) {
    transports.push(
      new winston.transports.Http({
        format: jsonFormat,
        level: elkOpts.http.level,
        ...parseHttpTransport(elkOpts.http.url),
      } as any),
    );
  }

  if (transports.length === 0) {
    transports.push(
      new winston.transports.Console({
        format: resolveConsoleFormat(),
      }),
    );
  }

  return transports;
}

export const winstonConfig: winston.LoggerOptions = {
  level: formatOpts.level,
  defaultMeta: {
    service: formatOpts.service,
    env: formatOpts.env,
    version: formatOpts.version,
  },
  exitOnError: false,
  transports: buildTransports(),
};

export function createLogger(context?: string): winston.Logger {
  return winston.createLogger({
    ...winstonConfig,
    defaultMeta: {
      ...((winstonConfig.defaultMeta as object) || {}),
      context,
    },
  });
}

export function logEvent(
  logger: winston.Logger,
  event: string,
  data: Record<string, unknown> = {},
  level: 'info' | 'warn' | 'error' | 'debug' = 'info',
) {
  logger.log(level, event, { event, ...data });
}

export function getActiveLogOptions(): LogFormatOptions {
  return { ...formatOpts };
}

export function getActiveTransportOptions(): TransportsConfig {
  return { ...transportOpts };
}

export function getActiveRotationOptions(): RotationConfig {
  return { ...rotationOpts };
}
