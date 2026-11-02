import { envSchema } from './env.schema.js';

const developmentEnv = {
  NODE_ENV: 'development',
  CORS_ORIGINS: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://classflow:change-me@localhost:5433/classflow',
  RABBITMQ_URL: 'amqp://classflow:change-me@localhost:5672/classflow',
  AUTH0_ISSUER_BASE_URL: 'https://classflow.eu.auth0.com/',
  AUTH0_AUDIENCE: 'https://api.classflow.local',
};

const productionEnv = {
  ...developmentEnv,
  NODE_ENV: 'production',
  CORS_ORIGINS: 'https://app.classflow.example',
  DATABASE_URL: 'postgresql://classflow:s3cret@db.internal:5432/classflow',
  RABBITMQ_URL: 'amqps://classflow:s3cret@mq.internal:5671/classflow',
};

function issuePaths(input: Record<string, string | undefined>): string[] {
  const result = envSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('envSchema', () => {
  it('accepts the .env.example values in development', () => {
    expect(envSchema.parse(developmentEnv)).toMatchObject({
      CORS_ORIGINS: ['http://localhost:3000'],
      DATABASE_LOG_QUERIES: false,
    });
  });

  it('reports a missing DATABASE_URL', () => {
    expect(issuePaths({ ...developmentEnv, DATABASE_URL: undefined })).toEqual([
      'DATABASE_URL',
    ]);
  });

  it('rejects a whitespace-only AUTH0_AUDIENCE', () => {
    expect(issuePaths({ ...developmentEnv, AUTH0_AUDIENCE: '  ' })).toEqual([
      'AUTH0_AUDIENCE',
    ]);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(issuePaths({ ...developmentEnv, NODE_ENV: 'prod' })).toEqual([
      'NODE_ENV',
    ]);
  });

  it('splits and trims CORS_ORIGINS', () => {
    const env = envSchema.parse({
      ...developmentEnv,
      CORS_ORIGINS: 'http://localhost:3000, https://app.classflow.example,',
    });

    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:3000',
      'https://app.classflow.example',
    ]);
  });

  it.each([
    'https://app.classflow.example/',
    'https://app.classflow.example/login',
    'htps://app.classflow.example',
    '*',
  ])('rejects %s as a CORS origin', (value) => {
    expect(issuePaths({ ...developmentEnv, CORS_ORIGINS: value })).toEqual([
      'CORS_ORIGINS.0',
    ]);
  });

  describe('in production', () => {
    it('accepts a production configuration', () => {
      expect(envSchema.safeParse(productionEnv).success).toBe(true);
    });

    it.each([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://[::1]:3000',
    ])('rejects %s in CORS_ORIGINS', (value) => {
      expect(
        issuePaths({
          ...productionEnv,
          CORS_ORIGINS: `https://app.classflow.example,${value}`,
        }),
      ).toEqual(['CORS_ORIGINS']);
    });

    it('rejects the placeholder database and RabbitMQ passwords', () => {
      expect(
        issuePaths({
          ...productionEnv,
          DATABASE_URL: developmentEnv.DATABASE_URL,
          RABBITMQ_URL: developmentEnv.RABBITMQ_URL,
        }),
      ).toEqual(['DATABASE_URL', 'RABBITMQ_URL']);
    });

    it('rejects query logging', () => {
      expect(
        issuePaths({ ...productionEnv, DATABASE_LOG_QUERIES: 'true' }),
      ).toEqual(['DATABASE_LOG_QUERIES']);
    });

    it('reports a missing DATABASE_URL without evaluating production rules', () => {
      expect(issuePaths({ ...productionEnv, DATABASE_URL: undefined })).toEqual(
        ['DATABASE_URL'],
      );
    });

    it('reports every production problem at once', () => {
      expect(
        issuePaths({
          ...developmentEnv,
          NODE_ENV: 'production',
          DATABASE_LOG_QUERIES: 'true',
        }),
      ).toEqual([
        'CORS_ORIGINS',
        'DATABASE_URL',
        'RABBITMQ_URL',
        'DATABASE_LOG_QUERIES',
      ]);
    });
  });
});
