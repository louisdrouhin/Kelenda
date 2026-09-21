import { verifyInternalRequest } from '@kelenda/shared';
import type { NextFunction, Request, Response } from 'express';

// Un secret dédié par paire appelant→calendar-service (doc section 5,
// "Authentification service-à-service"). Paire MVP connue : tracking-service
// (création d'un événement calendrier depuis un suivi tuteur).
const ALLOWED_CALLERS: Record<string, string | undefined> = {
  'tracking-service': process.env.INTERNAL_SECRET_TRACKING_CALENDAR,
};

export function requireInternalCaller(req: Request, res: Response, next: NextFunction): void {
  const callingService = req.header('X-Calling-Service');
  const timestamp = req.header('X-Timestamp');
  const signature = req.header('X-Signature');

  if (!callingService || !timestamp || !signature) {
    res.status(401).json({ error: 'En-têtes de signature interne manquants' });
    return;
  }

  const secret = ALLOWED_CALLERS[callingService];
  if (!secret) {
    res.status(401).json({ error: 'Appelant interne inconnu' });
    return;
  }

  const hasBody = req.body && Object.keys(req.body).length > 0;

  const isValid = verifyInternalRequest({
    secret,
    method: req.method,
    path: req.originalUrl,
    body: hasBody ? JSON.stringify(req.body) : '',
    timestamp,
    signature,
  });

  if (!isValid) {
    res.status(401).json({ error: 'Signature invalide' });
    return;
  }

  next();
}
