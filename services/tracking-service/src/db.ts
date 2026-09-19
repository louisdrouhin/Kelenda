import { Pool, types } from 'pg';

// Sans ce fix, le driver pg parse une colonne `date` en objet Date à minuit
// UTC puis le sérialise en heure locale du process — un end_date/start_date
// enregistré comme 2026-09-20 revient en JSON décalé d'un jour
// (2026-09-19T22:00:00.000Z en UTC+2). On garde la chaîne brute YYYY-MM-DD.
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
