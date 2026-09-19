import { Pool, types } from 'pg';

// Sans ce fix, le driver pg parse une colonne `date`/`timestamptz` sans
// heure explicite en objet Date local — cf. bug déjà rencontré et corrigé
// côté tracking-service (Kelenda_Suivi_Implementation.md, section 5).
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
