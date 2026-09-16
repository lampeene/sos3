/**
 * Normalized API error for the frontend.
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: string[];
  path?: string;
  requestId?: string;

  constructor(
    message: string,
    statusCode = 500,
    errors?: string[],
    path?: string,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.path = path;
    this.requestId = requestId;
  }

  /** Human-readable summary (message + optional list of errors) */
  get displayMessage(): string {
    if (this.errors && this.errors.length > 0) {
      return [this.message, ...this.errors].join(' · ');
    }
    return this.message;
  }
}

/**
 * Parse a failed fetch response into an ApiError.
 */
export async function parseApiError(res: Response): Promise<ApiError> {
  let body: any = null;

  try {
    body = await res.json();
  } catch {
    // non-JSON response
  }

  if (body && typeof body === 'object') {
    return new ApiError(
      body.message || res.statusText || 'Erreur serveur',
      body.statusCode || res.status,
      body.errors,
      body.path,
      body.requestId || res.headers.get('x-request-id') || undefined,
    );
  }

  // Fallback by status code
  const fallbackMessages: Record<number, string> = {
    400: 'Requête invalide',
    401: 'Non authentifié – veuillez vous reconnecter',
    403: 'Accès refusé',
    404: 'Ressource introuvable',
    409: 'Conflit – cette ressource existe déjà',
    422: 'Données invalides',
    429: 'Trop de requêtes – réessayez plus tard',
    500: 'Erreur serveur – réessayez plus tard',
    502: 'Service temporairement indisponible',
    503: 'Service temporairement indisponible',
  };

  return new ApiError(
    fallbackMessages[res.status] || `Erreur ${res.status}`,
    res.status,
  );
}
