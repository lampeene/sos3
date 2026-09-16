import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

/**
 * Cloudinary upload service.
 * Uses the unsigned upload or signed upload via REST API.
 * Docs: https://cloudinary.com/documentation/upload_images
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly folder: string;

  constructor(private config: ConfigService) {
    this.cloudName = this.config.get('CLOUDINARY_CLOUD_NAME') || '';
    this.apiKey = this.config.get('CLOUDINARY_API_KEY') || '';
    this.apiSecret = this.config.get('CLOUDINARY_API_SECRET') || '';
    this.folder = this.config.get('CLOUDINARY_FOLDER') || 'sos-points';

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      this.logger.warn('Cloudinary is not fully configured');
    }
  }

  /**
   * Generate a signed upload signature for client-side direct upload.
   * Safer than uploading through the server for large files.
   */
  getUploadSignature(params: { folder?: string; publicId?: string } = {}) {
    if (!this.apiSecret) {
      throw new BadRequestException('Cloudinary is not configured');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = params.folder || this.folder;

    // Build the string to sign (alphabetical order of keys)
    const toSign: Record<string, string | number> = {
      folder,
      timestamp,
    };
    if (params.publicId) {
      toSign.public_id = params.publicId;
    }

    const sorted = Object.keys(toSign)
      .sort()
      .map((k) => `${k}=${toSign[k]}`)
      .join('&');

    const signature = createHash('sha1')
      .update(sorted + this.apiSecret)
      .digest('hex');

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      folder,
      // Client will POST to:
      // https://api.cloudinary.com/v1_1/{cloudName}/image/upload
    };
  }

  /**
   * Server-side upload (useful for admin or when file is already on the server).
   * Accepts a base64 data URI or a remote URL.
   */
  async uploadFromBase64(
    base64Data: string,
    options: { folder?: string; publicId?: string } = {},
  ) {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new BadRequestException('Cloudinary is not configured');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = options.folder || this.folder;

    const form = new FormData();
    form.append('file', base64Data);
    form.append('api_key', this.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    if (options.publicId) {
      form.append('public_id', options.publicId);
    }

    // Sign
    const toSign = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = createHash('sha1').update(toSign).digest('hex');
    form.append('signature', signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      { method: 'POST', body: form },
    );

    const data = await res.json();

    if (!res.ok) {
      this.logger.error('Cloudinary upload failed', data);
      throw new BadRequestException(data.error?.message || 'Upload failed');
    }

    return {
      publicId: data.public_id as string,
      url: data.secure_url as string,
      format: data.format as string,
      width: data.width as number,
      height: data.height as number,
      bytes: data.bytes as number,
      originalFilename: data.original_filename as string,
    };
  }

  /**
   * Delete an image by public_id.
   */
  async delete(publicId: string) {
    if (!this.apiSecret) {
      throw new BadRequestException('Cloudinary is not configured');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = createHash('sha1').update(toSign).digest('hex');

    const form = new FormData();
    form.append('public_id', publicId);
    form.append('api_key', this.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      { method: 'POST', body: form },
    );

    return res.json();
  }
}
