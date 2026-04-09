import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from '../config.ts';

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
}
