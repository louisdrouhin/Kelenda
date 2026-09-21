import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import 'express-async-errors';
import { startEventConsumer } from './event-consumer';
import { internalRouter } from './routes/internal';
import { logsRouter } from './routes/logs';
import { preferencesRouter } from './routes/preferences';
import { subscriptionsRouter } from './routes/subscriptions';

const app = express();
const port = process.env.PORT ?? 3004;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/notifications/subscribe', subscriptionsRouter);
app.use('/notifications/preferences', preferencesRouter);
app.use('/notifications/logs', logsRouter);
app.use('/internal', internalRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

app.listen(port, () => {
  console.log(`notification-service listening on port ${port}`);
});

startEventConsumer();
