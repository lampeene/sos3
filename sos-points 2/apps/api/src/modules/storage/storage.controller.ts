import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private cloudinary: CloudinaryService) {}

  /**
   * Get a signed upload signature so the frontend can upload
   * directly to Cloudinary (recommended for images).
   */
  @Post('signature')
  getSignature(@Body() body: { folder?: string; publicId?: string }) {
    return this.cloudinary.getUploadSignature(body);
  }

  /**
   * Server-side upload (base64).
   * Prefer client-side direct upload when possible.
   */
  @Post('upload')
  async upload(
    @Body() body: { file: string; folder?: string; publicId?: string },
  ) {
    return this.cloudinary.uploadFromBase64(body.file, {
      folder: body.folder,
      publicId: body.publicId,
    });
  }

  @Delete(':publicId')
  async delete(@Param('publicId') publicId: string) {
    // publicId may contain slashes → encode on client
    const decoded = decodeURIComponent(publicId);
    return this.cloudinary.delete(decoded);
  }
}
