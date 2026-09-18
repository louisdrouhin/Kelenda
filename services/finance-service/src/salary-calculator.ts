import { pool } from './db';
import { APPRENTICE_NET_RATIO, SMIC_MONTHLY_GROSS } from './smic';

export interface SalaryScaleRow {
  smic_percentage: string | null;
  fixed_amount: string | null;
}

export async function findApplicableScale(age: number, contractYear: number): Promise<SalaryScaleRow | null> {
  const result = await pool.query<SalaryScaleRow>(
    `SELECT smic_percentage, fixed_amount
     FROM salary_scales
     WHERE contract_year = $1
       AND age_min <= $2
       AND (age_max IS NULL OR age_max >= $2)
       AND valid_from <= now()
       AND (valid_to IS NULL OR valid_to >= now())
     ORDER BY valid_from DESC
     LIMIT 1`,
    [contractYear, age]
  );

  return result.rows[0] ?? null;
}

export interface ComputedSalary {
  gross: number;
  net: number;
}

export function computeSalaryFromScale(scale: SalaryScaleRow): ComputedSalary {
  const gross = scale.fixed_amount
    ? Number(scale.fixed_amount)
    : Math.round(SMIC_MONTHLY_GROSS * (Number(scale.smic_percentage) / 100) * 100) / 100;

  const net = Math.round(gross * APPRENTICE_NET_RATIO * 100) / 100;

  return { gross, net };
}
