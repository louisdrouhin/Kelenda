import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import 'express-async-errors';
import { requireBasicAuth } from './caldav/require-basic-auth';
import { caldavCredentialsRouter } from './routes/caldav-credentials';
import { caldavDiscoveryRouter } from './routes/caldav-discovery';
import { caldavEventsRouter } from './routes/caldav-events';
import { conflictsRouter } from './routes/conflicts';
import { eventsRouter } from './routes/events';
import { freeSlotsRouter } from './routes/free-slots';
import { sourcesRouter } from './routes/sources';

const app = express();
const port = process.env.PORT ?? 3002;

app.use(express.json());
app.use(express.text({ type: ['application/xml', 'text/xml'] }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// RFC 6764 : chemin fixe, non préfixable — un client CalDAV le tente en
// premier avant de connaître quoi que ce soit sur l'API. Redirige vers le
// principal de l'utilisateur authentifié par Basic Auth.
app.propfind('/.well-known/caldav', requireBasicAuth, (req, res) => {
  res.setHeader('Location', `/calendar/caldav/principals/${req.caldavUserId}/`);
  res.status(301).send();
});

app.use('/calendar/sources', sourcesRouter);
app.use('/calendar/events', eventsRouter);
app.use('/calendar/conflicts', conflictsRouter);
app.use('/calendar/free-slots', freeSlotsRouter);
app.use('/calendar/caldav/credentials', caldavCredentialsRouter);
app.use('/calendar/caldav', caldavEventsRouter);
app.use('/calendar/caldav', caldavDiscoveryRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne' });
});

app.listen(port, () => {
  console.log(`calendar-service listening on port ${port}`);
});
