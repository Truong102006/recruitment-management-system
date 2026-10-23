import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureApi } from './common/bootstrap/configure-api';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  configureApi(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('environment.port') || 3000;

  await app.listen(port);
  logger.log(`API server successfully started on port ${port} with prefix /api`);
}

void bootstrap();
