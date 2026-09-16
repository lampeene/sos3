import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { getRequestId } from '../context/request-context';

/**
 * Application logger with structured event helpers.
 * Prefer this over console.log everywhere.
 *
 * @example
 * this.appLogger.event('payment.created', { paymentId, amountCents: 25000 });
 * this.appLogger.error('payment.failed', { paymentId, reason });
 */
@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  private base(meta: Record<string, unknown> = {}) {
    const requestId = getRequestId();
    return {
      ...(requestId ? { requestId } : {}),
      ...meta,
    };
  }

  log(message: any, context?: string) {
    this.logger.info(String(message), this.base({ context }));
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(String(message), this.base({ context, stack: trace }));
  }

  warn(message: any, context?: string) {
    this.logger.warn(String(message), this.base({ context }));
  }

  debug?(message: any, context?: string) {
    this.logger.debug(String(message), this.base({ context }));
  }

  verbose?(message: any, context?: string) {
    this.logger.verbose(String(message), this.base({ context }));
  }

  /**
   * Structured business event.
   * Produces: { "message": "payment.created", "event": "payment.created", ...data }
   */
  event(event: string, data: Record<string, unknown> = {}, level: 'info' | 'warn' | 'error' | 'debug' = 'info') {
    this.logger.log(level, event, this.base({ event, ...data }));
  }

  /**
   * HTTP-style structured log (used by middleware too).
   */
  http(data: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    [key: string]: unknown;
  }) {
    const level = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';
    this.logger.log(
      level,
      `${data.method} ${data.path} ${data.statusCode} ${data.durationMs}ms`,
      this.base({ event: 'http.request', ...data }),
    );
  }
}
