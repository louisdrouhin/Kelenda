import { Router } from 'express';
import { requireBasicAuth } from '../caldav/require-basic-auth';
import { buildMultistatus, buildResponse } from '../caldav/xml';

const router = Router();

const CALDAV_NS = 'urn:ietf:params:xml:ns:caldav';

// Principal : renvoie current-user-principal et calendar-home-set (RFC 4791 §6.2.1).
router.propfind('/principals/:userId/', requireBasicAuth, (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }

  const principalHref = `/calendar/caldav/principals/${req.caldavUserId}/`;
  const homeHref = `/calendar/caldav/calendars/${req.caldavUserId}/`;

  const body = buildMultistatus([
    buildResponse(
      principalHref,
      `        <D:resourcetype><D:collection/><D:principal/></D:resourcetype>
        <D:current-user-principal><D:href>${principalHref}</D:href></D:current-user-principal>
        <C:calendar-home-set xmlns:C="${CALDAV_NS}"><D:href>${homeHref}</D:href></C:calendar-home-set>`
    ),
  ]);

  res.status(207).type('application/xml; charset=utf-8').send(body);
});

// Calendar-home-set : liste les collections calendrier de l'utilisateur.
// Un seul calendrier "personal" par utilisateur pour ce MVP (pas de
// multi-calendrier — cohérent avec 'un seul caldav_perso par utilisateur').
router.propfind('/calendars/:userId/', requireBasicAuth, (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }

  const homeHref = `/calendar/caldav/calendars/${req.caldavUserId}/`;
  const collectionHref = `/calendar/caldav/calendars/${req.caldavUserId}/personal/`;

  const body = buildMultistatus([
    buildResponse(homeHref, '        <D:resourcetype><D:collection/></D:resourcetype>'),
    buildResponse(
      collectionHref,
      `        <D:resourcetype><D:collection/><C:calendar xmlns:C="${CALDAV_NS}"/></D:resourcetype>
        <D:displayname>Kelenda — Calendrier personnel</D:displayname>
        <C:supported-calendar-component-set xmlns:C="${CALDAV_NS}">
          <C:comp name="VEVENT"/>
        </C:supported-calendar-component-set>`
    ),
  ]);

  res.status(207).type('application/xml; charset=utf-8').send(body);
});

export { router as caldavDiscoveryRouter };
