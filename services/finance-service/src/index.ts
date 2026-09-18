import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import 'express-async-errors';

const app = express();
const port = process.env.PORT ?? 3003;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

app.listen(port, () => {
  console.log(`finance-service listening on port ${port}`);
});
