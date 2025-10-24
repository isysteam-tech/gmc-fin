import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  private minioClient: Client;
  private readonly bucketName = 'gms-docs';

  constructor() {
    this.minioClient = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  }

  async uploadFile(bucket: string, path: string, buffer: Buffer, mimetype: string) {
    const exists = await this.minioClient.bucketExists(bucket);
    if (!exists) await this.minioClient.makeBucket(bucket, 'us-east-1');

    await this.minioClient.putObject(bucket, path, buffer, undefined, { 'Content-Type': mimetype });
    return `/${bucket}/${path}`;
  }

  async getFileUrl(bucket: string, path: string) {
    return await this.minioClient.presignedGetObject(bucket, path);
  }

    async downloadFile(filePath: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.minioClient.getObject(this.bucketName, filePath);
    } catch (err) {
      console.error('MinIO download error:', err);
      throw new InternalServerErrorException('Failed to download file');
    }
  }
}
