import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { createLogger } from '../logger/winston.config';
import { getRequestId } from '../context/request-context';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: WinstonLogger;

  constructor(
    @Optional()
    @Inject(WINSTON_MODULE_PROVIDER)
    winston?: WinstonLogger,
  ) {
    this.logger = winston || createLogger('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = getRequestId() || (request as any).requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur interne est survenue';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        if (Array.isArray(obj.message)) {
          errors = obj.message;
          message = obj.message[0] || obj.error || message;
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        }
        if (Array.isArray(obj.errors)) {
          errors = obj.errors;
          message = obj.message || message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    if (
      status === HttpStatus.INTERNAL_SERVER_ERROR &&
      process.env.NODE_ENV === 'production'
    ) {
      message = 'Une erreur interne est survenue';
      errors = undefined;
    }

    const logMeta = {
      requestId,
      method: request.method,
      path: request.url,
      statusCode: status,
      ip: request.ip,
      userId: (request as any).user?.id,
      errors,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status >= 500) {
      this.logger.error(message, logMeta);
    } else if (status >= 400) {
      this.logger.warn(message, logMeta);
    } else {
      this.logger.info(message, logMeta);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && errors.length > 0 ? { errors } : {}),
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
