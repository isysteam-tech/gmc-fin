import { config } from 'dotenv';
config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log(process.env.PORT, 'process.env.PORT');



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on:${process.env.PORT || 3000}`);
}
bootstrap();
