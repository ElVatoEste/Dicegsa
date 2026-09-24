import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
app.enableCors();
// Socket.io se monta sobre el servidor HTTP que expone Fastify, no sobre uno propio.
app.useWebSocketAdapter(new IoAdapter(app));

const port = Number(process.env.PORT ?? 7300);
// Detrás de un proxy se escucha solo en local; sin HOST, en todas las interfaces para desarrollo.
await app.listen({ port, host: process.env.HOST ?? '0.0.0.0' });
console.log(`API escuchando en http://localhost:${port}`);
