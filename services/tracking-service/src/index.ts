import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import 'express-async-errors';
import { startMissionScheduledConsumer } from './mission-scheduled-consumer';
import { missionsRouter } from './routes/missions';

const app = express();
const port = process.env.PORT ?? 3003;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/tracking/missions', missionsRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

app.listen(port, () => {
  console.log(`tracking-service listening on port ${port}`);
});

startMissionScheduledConsumer();
