import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { vectorizeData } from './vectorize.handler';
import { vectorizeRequestSchema } from './vectorize.schema';

const vectorizeRouter = new Hono();

vectorizeRouter.post('/', zValidator('json', vectorizeRequestSchema), vectorizeData);

export default vectorizeRouter;