import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    const url = config.get('SUPABASE_URL');
    const key = config.get('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = config.get('SUPABASE_STORAGE_BUCKET', 'furnibles-files');
    this.publicUrl = `${url}/storage/v1/object/public/${this.bucket}`;

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  async upload(path: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase upload failed for ${path}: ${error.message}`);
      throw new InternalServerErrorException('File upload failed');
    }

    return `${this.publicUrl}/${path}`;
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      this.logger.warn(`Supabase delete failed for ${path}: ${error.message}`);
    }
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(path);
    if (error || !data) {
      throw new InternalServerErrorException('File download failed');
    }
    return Buffer.from(await data.arrayBuffer());
  }
}
