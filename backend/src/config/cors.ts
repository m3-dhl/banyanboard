import { CorsOptions } from 'cors';

export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ?? '*';
  const methods = process.env.CORS_ALLOWED_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE';
  const allowedHeaders = process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type,Authorization';

  return {
    origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(',').map(s => s.trim()),
    methods: methods.split(',').map(s => s.trim()),
    allowedHeaders: allowedHeaders.split(',').map(s => s.trim()),
  };
}
