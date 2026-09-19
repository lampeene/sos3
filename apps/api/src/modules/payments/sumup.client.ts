import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Lightweight SumUp API client.
 * Documentation: https://developer.sumup.com/online-payments
 */
@Injectable()
export class SumUpClient {
  private readonly logger = new Logger(SumUpClient.name);
  private readonly apiKey: string;
  private readonly merchantCode: string;
  private readonly baseUrl = 'https://api.sumup.com/v0.1';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('SUMUP_API_KEY') || '';
    this.merchantCode = this.config.get<string>('SUMUP_MERCHANT_CODE') || '';
    if (!this.apiKey || !this.merchantCode) {
      this.logger.warn('SUMUP_API_KEY or SUMUP_MERCHANT_CODE is not set – payments will fail');
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new BadRequestException('SumUp is not configured');
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.logger.error(`SumUp error ${res.status}`, data);
      throw new BadRequestException(
        data?.message || data?.error_message || `SumUp error ${res.status}`,
      );
    }

    return data as T;
  }

  /**
   * Create a hosted checkout (card, Apple Pay, Google Pay).
   * @param amount Amount in euros (decimal, e.g. 250.00)
   */
  async createCheckout(params: {
    amount: number;
    currency?: string;
    checkoutReference: string;
    description?: string;
    returnUrl: string;
    redirectUrl: string;
  }) {
    const payload = {
      amount: params.amount,
      currency: params.currency || 'EUR',
      checkout_reference: params.checkoutReference,
      merchant_code: this.merchantCode,
      description: params.description || 'Stage de récupération de points',
      return_url: params.returnUrl,
      redirect_url: params.redirectUrl,
      hosted_checkout: { enabled: true },
    };

    this.logger.log(`Creating SumUp checkout: ${params.amount} EUR (ref=${params.checkoutReference})`);

    return this.request<{
      id: string;
      checkout_reference: string;
      amount: number;
      currency: string;
      status: 'PENDING' | 'PAID' | 'FAILED';
      hosted_checkout_url: string;
      merchant_code: string;
    }>('POST', '/checkouts', payload);
  }

  /**
   * Retrieve a checkout by its SumUp ID – used to verify status server-side
   * (never trust the webhook payload alone).
   */
  async getCheckout(id: string) {
    return this.request<{
      id: string;
      checkout_reference: string;
      amount: number;
      currency: string;
      status: 'PENDING' | 'PAID' | 'FAILED';
    }>('GET', `/checkouts/${id}`);
  }
}
