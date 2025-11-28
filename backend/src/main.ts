import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { APP_PORT } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['X-New-Token'],
  });
  const configService = app.get(ConfigService);
  const appPort = configService.get<number>(APP_PORT);
  const envPort = process.env.PORT ? Number(process.env.PORT) : undefined;
  const port = envPort || appPort || 3000;
  console.log('listening on port', port);
  console.log(`listening on http://0.0.0.0:${port}`);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
