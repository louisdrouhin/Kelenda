import { Router } from 'express';
import { fetchCollectiveAgreementBySiret } from '../clients/entreprise-api';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';
import { computeSalaryFromScale, findApplicableScale } from '../salary-calculator';

const simulateSalaryRouter = Router();
const simulationsRouter = Router();

simulateSalaryRouter.post('/', requireAuth, async (req, res) => {
  const { age, contract_year, diploma_level, siret } = req.body ?? {};

  if (typeof age !== 'number' || !Number.isInteger(age) || age < 15 || age > 99) {
    return res.status(400).json({ error: 'age doit être un entier réaliste' });
  }
  if (typeof contract_year !== 'number' || !Number.isInteger(contract_year) || contract_year < 1 || contract_year > 4) {
    return res.status(400).json({ error: 'contract_year doit être un entier entre 1 et 4' });
  }
  if (diploma_level !== undefined && typeof diploma_level !== 'string') {
    return res.status(400).json({ error: 'diploma_level doit être une chaîne' });
  }
  if (siret !== undefined && (typeof siret !== 'string' || !/^\d{14}$/.test(siret))) {
    return res.status(400).json({ error: 'siret doit être une chaîne de 14 chiffres' });
  }

  const scale = await findApplicableScale(age, contract_year);
  if (!scale) {
    return res.status(422).json({ error: 'Aucun barème applicable pour ces critères' });
  }

  const { gross, net } = computeSalaryFromScale(scale);

  let agreementId: string | null = null;
  if (siret) {
    const agreementInfo = await fetchCollectiveAgreementBySiret(siret);
    if (agreementInfo) {
      const upserted = await pool.query(
        `INSERT INTO collective_agreements (idcc_code, name, fetched_at)
         VALUES ($1, $2, now())
         ON CONFLICT (idcc_code) DO UPDATE SET name = $2, fetched_at = now()
         RETURNING id`,
        [agreementInfo.idccCode, agreementInfo.name]
      );
      agreementId = upserted.rows[0].id;
    }
  }

  const inputParams = { age, contract_year, diploma_level: diploma_level ?? null, siret: siret ?? null };

  const result = await pool.query(
    `INSERT INTO salary_simulations (user_id, agreement_id, input_params, computed_gross, computed_net)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, agreement_id, input_params, computed_gross, computed_net, computed_at`,
    [req.auth!.sub, agreementId, JSON.stringify(inputParams), gross, net]
  );

  return res.status(201).json(result.rows[0]);
});

simulationsRouter.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, agreement_id, input_params, computed_gross, computed_net, computed_at
     FROM salary_simulations
     WHERE user_id = $1
     ORDER BY computed_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

simulationsRouter.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, agreement_id, input_params, computed_gross, computed_net, computed_at
     FROM salary_simulations
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.auth!.sub]
  );

  const simulation = result.rows[0];
  if (!simulation) {
    return res.status(404).json({ error: 'Simulation introuvable' });
  }

  return res.status(200).json(simulation);
});

export { simulateSalaryRouter, simulationsRouter };
