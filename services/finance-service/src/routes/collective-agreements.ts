import { Router } from 'express';
import { fetchCollectiveAgreementBySiret } from '../clients/siret2idcc';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.get('/:siret', requireAuth, async (req, res) => {
  const { siret } = req.params;

  if (!/^\d{14}$/.test(siret)) {
    return res.status(400).json({ error: 'siret doit être une chaîne de 14 chiffres' });
  }

  const agreement = await fetchCollectiveAgreementBySiret(siret);
  if (!agreement) {
    return res.status(404).json({ error: 'Aucune convention collective trouvée pour ce SIRET' });
  }

  return res.status(200).json({ idcc_code: agreement.idccCode, name: agreement.name });
});

export { router as collectiveAgreementsRouter };
