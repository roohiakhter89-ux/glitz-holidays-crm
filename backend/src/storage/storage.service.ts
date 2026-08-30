import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

/**
 * Supabase Storage is S3-compatible. This service wraps @aws-sdk/client-s3
 * configured against the Supabase Storage endpoint so uploads go to a
 * durable bucket rather than Render's ephemeral disk.
 *
 * Required env vars (see .env.example):
 *   SUPABASE_STORAGE_URL      – e.g. https://<project-ref>.supabase.co/storage/v1/s3
 *   SUPABASE_STORAGE_KEY      – service_role key (not anon)
 *   SUPABASE_STORAGE_BUCKET   – bucket name, e.g. "attachments"
 *   SUPABASE_STORAGE_REGION   – usually "us-east-1" (Supabase default)
 *   SUPABASE_PUBLIC_URL       – e.g. https://<project-ref>.supabase.co/storage/v1/object/public
 *
 * When SUPABASE_STORAGE_URL is unset the service logs a warning but does
 * NOT crash the app — other modules continue to work. Uploads will throw
 * at call time instead.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('SUPABASE_STORAGE_URL');
    const accessKey = config.get<string>('SUPABASE_STORAGE_KEY');
    const bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'attachments';
    const region = config.get<string>('SUPABASE_STORAGE_REGION') ?? 'us-east-1';
    const publicUrl = config.get<string>('SUPABASE_PUBLIC_URL') ?? '';

    this.bucket = bucket;
    this.publicBaseUrl = publicUrl;

    if (!endpoint || !accessKey) {
      this.logger.warn(
        'SUPABASE_STORAGE_URL or SUPABASE_STORAGE_KEY not set — file uploads disabled. ' +
        'Set them in .env to enable durable file storage.',
      );
      this.client = null;
      return;
    }

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: accessKey, // Supabase uses the same key for both
      },
      forcePathStyle: true,
    });

    this.logger.log(`Storage configured → bucket "${bucket}" at ${endpoint}`);
  }

  /** True when credentials are configured and uploads will work. */
  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Upload a file buffer and return its public URL.
   *
   * @param buffer   Raw file bytes (from Multer's file.buffer)
   * @param originalName  Original filename — used to preserve the extension
   * @param folder   Logical folder inside the bucket, e.g. "hr-docs", "vouchers"
   * @returns        Public URL of the uploaded file
   */
  async upload(
    buffer: Buffer,
    originalName: string,
    folder: string,
  ): Promise<string> {
    if (!this.client) {
      throw new Error(
        'Storage is not configured. Set SUPABASE_STORAGE_URL and SUPABASE_STORAGE_KEY in .env.',
      );
    }

    const ext = path.extname(originalName) || '';
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: this.guessMimeType(ext),
      }),
    );

    // Supabase public URL pattern:
    // https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<key>
    const publicUrl = this.publicBaseUrl
      ? `${this.publicBaseUrl}/${this.bucket}/${key}`
      : key; // fallback: just the key, caller can construct URL

    this.logger.log(`Uploaded ${key} (${buffer.length} bytes)`);
    return publicUrl;
  }

  private guessMimeType(ext: string): string {
    const map: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
    };
    return map[ext.toLowerCase()] ?? 'application/octet-stream';
  }
}
