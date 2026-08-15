import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withUser } from './_lib/auth.js';
import { loadState } from './_lib/state.js';

/** Everything the signed-in user has, in one request. */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json(await loadState(userId));
});
