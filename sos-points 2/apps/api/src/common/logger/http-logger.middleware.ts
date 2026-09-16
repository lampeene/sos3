import { Injectable, NestMiddleware, Inject, LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getRequestId, setContextUserId } from '../context/request-context';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const requestId = getRequestId() || (req as any).requestId;

    res.on('finish', () => {
      const user = (req as any).user;
      if (user?.id) {
        setContextUserId(user.id);
      }

      const duration = Date.now() - start;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      const meta = {
        requestId,
        method,
        path: originalUrl,
        statusCode,
        durationMs: duration,
        contentLength: Number(contentLength),
        ip,
        userId: user?.id,
        userAgent: userAgent.slice(0, 100),
      };

      const message = `${method} ${originalUrl} ${statusCode} ${duration}ms`;

      if (statusCode >= 500) {
        this.logger.error(message, meta as any);
      } else if (statusCode >= 400) {
        this.logger.warn(message, meta as any);
      } else {
        this.logger.log(message, meta as any);
      }
    });

    next();
  }
}
