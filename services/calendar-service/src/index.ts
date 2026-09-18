import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import 'express-async-errors';
import { conflictsRouter } from './routes/conflicts';
import { eventsRouter } from './routes/events';
import { freeSlotsRouter } from './routes/free-slots';
import { sourcesRouter } from './routes/sources';

const app = express();
const port = process.env.PORT ?? 3002;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/calendar/sources', sourcesRouter);
app.use('/calendar/events', eventsRouter);
app.use('/calendar/conflicts', conflictsRouter);
app.use('/calendar/free-slots', freeSlotsRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

app.listen(port, () => {
  console.log(`calendar-service listening on port ${port}`);
});
