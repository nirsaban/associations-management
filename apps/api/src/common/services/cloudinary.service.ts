import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export interface CloudinaryUploadResult {
  secureUrl: string;
  bytes: number;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload an image file to Cloudinary under a given folder path.
   * Validates MIME type and file size before uploading.
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'סוג קובץ לא נתמך. יש להעלות PNG, JPG, WebP או SVG בלבד.',
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('הקובץ חורג מהמגבלה של 2MB.');
    }

    this.logger.log(`Uploading image to Cloudinary folder: ${folder}`);

    const result = await new Promise<{
      secure_url: string;
      bytes: number;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              return reject(error ?? new Error('Upload failed'));
            }
            resolve({
              secure_url: uploadResult.secure_url,
              bytes: uploadResult.bytes,
              public_id: uploadResult.public_id,
            });
          },
        )
        .end(file.buffer);
    });

    this.logger.log(`Upload complete: ${result.public_id}`);

    return {
      secureUrl: result.secure_url,
      bytes: result.bytes,
      publicId: result.public_id,
    };
  }

  /**
   * Upload any asset (image or video) to Cloudinary.
   * Used by the landing page module.
   */
  async uploadAsset(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    const result = await new Promise<{
      secure_url: string;
      bytes: number;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              return reject(error ?? new Error('Upload failed'));
            }
            resolve({
              secure_url: uploadResult.secure_url,
              bytes: uploadResult.bytes,
              public_id: uploadResult.public_id,
            });
          },
        )
        .end(file.buffer);
    });

    return {
      secureUrl: result.secure_url,
      bytes: result.bytes,
      publicId: result.public_id,
    };
  }
}
