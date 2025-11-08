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
  
  const configService= app.get(ConfigService)
  const port= configService.get<number>(APP_PORT)
  console.log('listening on port ', port)
  console.log(`listening on http://localhost:${port}`)
  await app.listen(port?? 3000);
}
bootstrap();
