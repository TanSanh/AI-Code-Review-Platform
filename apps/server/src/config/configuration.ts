export default () => ({
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  api_prefix: process.env.API_PREFIX || 'api/v1',
  cors_origin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN || '7d',
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  ai: {
    anthropic_api_key: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4.8',
    base_url: process.env.AI_BASE_URL || 'https://api.nhà cung cấp dịch vụ AI.com',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'ai-code-review',
    access_key: process.env.S3_ACCESS_KEY,
    secret_key: process.env.S3_SECRET_KEY,
    force_path_style: process.env.S3_FORCE_PATH_STYLE === 'true',
  },

  rate_limit: {
    window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },

  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    callback_url: process.env.GOOGLE_CALLBACK_URL,
  },
});
