import { publishEvent } from '@kelenda/shared';
import { Router } from 'express';
import { matchAids } from '../aids-catalog';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, input_params, aid_name, eligibility_hint, redirect_url, matched_at
     FROM aid_matches
     WHERE user_id = $1
     ORDER BY matched_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.post('/check', requireAuth, async (req, res) => {
  const { age, monthly_income, city, status } = req.body ?? {};

  if (age !== undefined && (typeof age !== 'number' || !Number.isInteger(age) || age < 15 || age > 99)) {
    return res.status(400).json({ error: 'age doit être un entier réaliste' });
  }
  if (monthly_income !== undefined && (typeof monthly_income !== 'number' || monthly_income < 0)) {
    return res.status(400).json({ error: 'monthly_income doit être un nombre positif' });
  }
  if (city !== undefined && typeof city !== 'string') {
    return res.status(400).json({ error: 'city doit être une chaîne' });
  }
  if (status !== undefined && typeof status !== 'string') {
    return res.status(400).json({ error: 'status doit être une chaîne' });
  }

  const criteria = { age, monthlyIncome: monthly_income, city, status };
  const matches = matchAids(criteria);

  const inputParams = { age: age ?? null, monthly_income: monthly_income ?? null, city: city ?? null, status: status ?? null };
  const created = [];

  for (const aid of matches) {
    const result = await pool.query(
      `INSERT INTO aid_matches (user_id, input_params, aid_name, eligibility_hint, redirect_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, input_params, aid_name, eligibility_hint, redirect_url, matched_at`,
      [req.auth!.sub, JSON.stringify(inputParams), aid.name, JSON.stringify({ hint: aid.hint(criteria) }), aid.redirectUrl]
    );
    const aidMatch = result.rows[0];
    created.push(aidMatch);

    const natsUrl = process.env.NATS_URL;
    if (natsUrl) {
      await publishEvent(natsUrl, 'finance', 'aide_disponible_detectee', {
        user_id: req.auth!.sub,
        aid_match_id: aidMatch.id,
        aid_name: aidMatch.aid_name,
        redirect_url: aidMatch.redirect_url,
      });
    }
  }

  return res.status(201).json(created);
});

export { router as aidsRouter };
