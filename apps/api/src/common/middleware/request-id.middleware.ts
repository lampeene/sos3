import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from '../context/request-context';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Correlation / Trace ID middleware.
 *
 * - Reads X-Request-Id from incoming request (if provided by client/gateway)
 * - Otherwise generates a UUID v4
 * - Stores it in AsyncLocalStorage for the whole request lifecycle
 * - Sets X-Request-Id on the response headers
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId =
      (typeof incoming === 'string' && incoming.trim()) || randomUUID();

    // Expose on request for easy access
    (req as any).requestId = requestId;

    // Return to client / upstream
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Run the rest of the pipeline inside the ALS context
    requestContext.run(
      {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
      },
      () => next(),
    );
  }
}
