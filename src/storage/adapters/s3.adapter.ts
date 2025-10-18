import { IStorageService } from '../storage.interface';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

interface SignedRequest {
  method: string;
  path: string;
  host: string;
  body?: Buffer;
  headers: Record<string, string>;
}

export class S3Adapter implements IStorageService {
  private readonly endpoint: string;
  private readonly bucket: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly region: string;
  private readonly useHttps: boolean;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.bucket = this.configService.get<string>('S3_BUCKET');
    this.accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    this.secretKey = this.configService.get<string>('S3_SECRET_KEY');
    this.region = this.configService.get<string>('S3_REGION', 'us-east-1');

    this.useHttps = this.endpoint.startsWith('https://');
  }

  async store(id: string, data: Buffer): Promise<void> {
    const path = `/${this.bucket}/${id}`;
    const host = this.endpoint.replace(/^https?:\/\//, '');

    const signedRequest = this.signRequest({
      method: 'PUT',
      path,
      host,
      body: data,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length.toString(),
      },
    });

    await this.executeRequest(signedRequest);
  }

  async retrieve(id: string): Promise<Buffer> {
    const path = `/${this.bucket}/${id}`;
    const host = this.endpoint.replace(/^https?:\/\//, '');

    const signedRequest = this.signRequest({
      method: 'GET',
      path,
      host,
      headers: {},
    });

    return await this.executeRequest(signedRequest);
  }

  private signRequest(options: {
    method: string;
    path: string;
    host: string;
    body?: Buffer;
    headers: Record<string, string>;
  }): SignedRequest {
    const { method, path, host, body, headers } = options;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = body
      ? crypto.createHash('sha256').update(body).digest('hex')
      : crypto.createHash('sha256').update('').digest('hex');

    const canonicalHeaders = {
      ...headers,
      host: host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const canonicalHeadersStr = Object.keys(canonicalHeaders)
      .sort()
      .map((key) => `${key.toLowerCase()}:${canonicalHeaders[key]}`)
      .join('\n');

    const signedHeaders = Object.keys(canonicalHeaders)
      .sort()
      .map((key) => key.toLowerCase())
      .join(';');

    const canonicalRequest = [
      method,
      path,
      '',
      canonicalHeadersStr,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const canonicalRequestHash = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    const signature = this.calculateSignature(stringToSign, dateStamp);

    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    return {
      method,
      path,
      host,
      body,
      headers: {
        ...canonicalHeaders,
        Authorization: authorization,
      },
    };
  }

  private calculateSignature(stringToSign: string, dateStamp: string): string {
    const kDate = this.hmac(`AWS4${this.secretKey}`, dateStamp);
    const kRegion = this.hmac(kDate, this.region);
    const kService = this.hmac(kRegion, 's3');
    const kSigning = this.hmac(kService, 'aws4_request');

    return this.hmac(kSigning, stringToSign).toString('hex');
  }

  private hmac(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  private executeRequest(signedRequest: SignedRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const httpModule = this.useHttps ? https : http;
      const url = new URL(`${this.endpoint}${signedRequest.path}`);

      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (this.useHttps ? 443 : 80),
        path: signedRequest.path,
        method: signedRequest.method,
        headers: signedRequest.headers,
      };

      const req = httpModule.request(requestOptions, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            const errorMessage = body.toString('utf-8');
            reject(
              new Error(
                `S3 request failed with status ${res.statusCode}: ${errorMessage}`,
              ),
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`S3 request error: ${error.message}`));
      });

      if (signedRequest.body) {
        req.write(signedRequest.body);
      }

      req.end();
    });
  }
}
