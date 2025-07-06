import { Hono } from 'hono';

const business = new Hono();

business.get('/', (c) => c.json({ message: 'Business endpoint' }));

export default business;
