import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextStore = {
  requestId: string;
  userId?: number;
  method?: string;
  path?: string;
};

/**
 * AsyncLocalStorage-based request context.
 * Makes requestId available anywhere in the call stack without passing it around.
 */
export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore();
}

export function setContextUserId(userId: number) {
  const store = requestContext.getStore();
  if (store) {
    store.userId = userId;
  }
}
