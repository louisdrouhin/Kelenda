import { Router } from 'express';
import { issueCaldavCredentials } from '../caldav/credentials';
import { fetchAuthUser } from '../internal-clients/auth';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const authUser = await fetchAuthUser(req.auth!.sub);

  const credentials = await issueCaldavCredentials(req.auth!.sub, authUser.email);

  return res.status(201).json(credentials);
});

export { router as caldavCredentialsRouter };
