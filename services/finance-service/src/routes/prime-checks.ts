import { publishEvent } from '@kelenda/shared';
import { Router } from 'express';
import { searchKaliConventionText } from '../clients/legifrance';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

// Types de primes conventionnelles recherchées dans le texte de la
// convention (B.2, doc section 3 — ex. prime de vacances Syntec, point de
// départ personnel du projet). Liste fermée pour le MVP, extensible sans
// migration (pas stockée en DB).
const KNOWN_PRIME_TYPES: Record<string, string> = {
  prime_vacances: 'prime de vacances',
  prime_anciennete: 'prime d\'ancienneté',
  treizieme_mois: 'treizième mois',
};

router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;

  if (status !== undefined && typeof status === 'string' && !['detected', 'confirmed_missing', 'resolved'].includes(status)) {
    return res.status(400).json({ error: "status doit être l'un de : detected, confirmed_missing, resolved" });
  }

  const result = await pool.query(
    `SELECT id, agreement_id, prime_type, expected_amount, status, detected_at
     FROM prime_checks
     WHERE user_id = $1
       AND ($2::text IS NULL OR status = $2)
     ORDER BY detected_at DESC`,
    [req.auth!.sub, status ?? null]
  );

  return res.status(200).json(result.rows);
});

router.post('/check', requireAuth, async (req, res) => {
  const { agreement_id, prime_type } = req.body ?? {};

  if (typeof agreement_id !== 'string') {
    return res.status(400).json({ error: 'agreement_id est requis' });
  }
  if (typeof prime_type !== 'string' || !(prime_type in KNOWN_PRIME_TYPES)) {
    return res
      .status(400)
      .json({ error: `prime_type doit être l'un de : ${Object.keys(KNOWN_PRIME_TYPES).join(', ')}` });
  }

  const agreementResult = await pool.query('SELECT idcc_code FROM collective_agreements WHERE id = $1', [
    agreement_id,
  ]);
  const agreement = agreementResult.rows[0];
  if (!agreement) {
    return res.status(404).json({ error: 'Convention collective introuvable' });
  }

  const matches = await searchKaliConventionText(agreement.idcc_code, KNOWN_PRIME_TYPES[prime_type]);
  if (matches.length === 0) {
    // Rien trouvé dans le texte : soit la convention ne prévoit pas cette
    // prime, soit Légifrance n'a pas pu être interrogé (non configuré, en
    // échec) — dans les deux cas on ne crée pas de prime_checks : on
    // n'affirme une prime "détectée" que sur un résultat positif réel.
    return res.status(200).json({ detected: false });
  }

  const result = await pool.query(
    `INSERT INTO prime_checks (user_id, agreement_id, prime_type)
     VALUES ($1, $2, $3)
     RETURNING id, agreement_id, prime_type, expected_amount, status, detected_at`,
    [req.auth!.sub, agreement_id, prime_type]
  );
  const primeCheck = result.rows[0];

  const natsUrl = process.env.NATS_URL;
  if (natsUrl) {
    await publishEvent(natsUrl, 'finance', 'prime_manquante_detectee', {
      user_id: req.auth!.sub,
      prime_check_id: primeCheck.id,
      prime_type: primeCheck.prime_type,
      expected_amount: primeCheck.expected_amount,
    });
  }

  return res.status(201).json(primeCheck);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body ?? {};

  if (typeof status !== 'string' || !['confirmed_missing', 'resolved'].includes(status)) {
    return res.status(400).json({ error: "status doit être 'confirmed_missing' ou 'resolved'" });
  }

  const result = await pool.query(
    `UPDATE prime_checks
     SET status = $3
     WHERE id = $1 AND user_id = $2
     RETURNING id, agreement_id, prime_type, expected_amount, status, detected_at`,
    [req.params.id, req.auth!.sub, status]
  );

  const primeCheck = result.rows[0];
  if (!primeCheck) {
    return res.status(404).json({ error: 'Vérification introuvable' });
  }

  return res.status(200).json(primeCheck);
});

export { router as primeChecksRouter };
