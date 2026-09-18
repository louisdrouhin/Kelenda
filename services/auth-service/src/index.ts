import express from 'express';

const app = express();
const port = process.env.PORT ?? 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`auth-service listening on port ${port}`);
});
