import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  const database = { isHealthy: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [{ provide: DatabaseHealthIndicator, useValue: database }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports ok when the database is up', async () => {
    database.isHealthy.mockResolvedValue({ database: { status: 'up' } });

    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      details: { database: { status: 'up' } },
    });
  });

  it('fails when the database is down', async () => {
    database.isHealthy.mockResolvedValue({ database: { status: 'down' } });

    await expect(controller.check()).rejects.toThrow();
  });
});
