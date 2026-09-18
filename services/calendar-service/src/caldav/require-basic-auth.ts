import type { NextFunction, Request, Response } from 'express';
import { verifyCaldavCredentials } from './credentials';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      caldavUserId?: string;
    }
  }
}

// CalDAV (RFC 4791) parle HTTP Basic Auth, pas Bearer JWT — les clients
// (app Calendrier iPhone/macOS, Google Calendar) n'implémentent pas OAuth
// pour ce protocole. D'où des identifiants dédiés (voir credentials.ts),
// jamais le mot de passe du compte Kelenda.
export async function requireBasicAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Kelenda CalDAV"');
    res.status(401).send();
    return;
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Kelenda CalDAV"');
    res.status(401).send();
    return;
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  const identity = await verifyCaldavCredentials(username, password);
  if (!identity) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Kelenda CalDAV"');
    res.status(401).send();
    return;
  }

  req.caldavUserId = identity.userId;
  next();
}
