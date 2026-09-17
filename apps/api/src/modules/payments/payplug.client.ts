import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Lightweight PayPlug API client.
 * Documentation: https://docs.payplug.com/
 *
 * Uses the official REST API (no dependency on the old payplug-nodejs package).
 */
@Injectable()
export class PayPlugClient {
  private readonly logger = new Logger(PayPlugClient.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.payplug.com/v1';

  constructor(private config: ConfigService) {
    this.secretKey = this.config.get<string>('PAYPLUG_SECRET_KEY') || '';
    if (!this.secretKey) {
      this.logger.warn('PAYPLUG_SECRET_KEY is not set – payments will fail');
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>,
  ): Promise<T> {
    if (!this.secretKey) {
      throw new BadRequestException('PayPlug is not configured');
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.logger.error(`PayPlug error ${res.status}`, data);
      throw new BadRequestException(
        data?.message || data?.error || `PayPlug error ${res.status}`,
      );
    }

    return data as T;
  }

  /**
   * Create a payment.
   * @param amount Amount in cents (e.g. 25000 = 250.00 €)
   * @param options Additional PayPlug options
   */
  async createPayment(params: {
    amount: number; // cents
    currency?: string;
    customer?: {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    hosted_payment?: {
      return_url: string;
      cancel_url: string;
    };
    notification_url?: string;
    metadata?: Record<string, string>;
    description?: string;
  }) {
    const payload = {
      amount: params.amount,
      currency: params.currency || 'EUR',
      customer: params.customer,
      hosted_payment: params.hosted_payment,
      notification_url: params.notification_url,
      metadata: params.metadata,
      description: params.description || 'Stage de récupération de points',
    };

    this.logger.log(`Creating PayPlug payment: ${params.amount} cents`);

    return this.request<{
      id: string;
      object: string;
      is_live: boolean;
      amount: number;
      currency: string;
      payment_url: string;
      hosted_payment: {
        payment_url: string;
        return_url: string;
        cancel_url: string;
      };
      notification_url: string;
      metadata: Record<string, string>;
      is_paid: boolean;
      is_refunded: boolean;
      created_at: number;
    }>('POST', '/payments', payload);
  }

  /**
   * Retrieve a payment by its PayPlug ID.
   */
  async getPayment(payId: string) {
    return this.request<{
      id: string;
      amount: number;
      currency: string;
      is_paid: boolean;
      is_refunded: boolean;
      failure?: {
        code: string;
        message: string;
      };
      metadata: Record<string, string>;
      created_at: number;
    }>('GET', `/payments/${payId}`);
  }

  /**
   * Refund a payment (full or partial).
   */
  async refundPayment(payId: string, amount?: number) {
    const body = amount ? { amount } : {};
    return this.request('POST', `/payments/${payId}/refunds`, body);
  }
}
