import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withUser } from '../_lib/auth.js';
import { collection, isCollection } from '../_lib/collections.js';

/** Creates one row in a collection, owned by the signed-in user. */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const name = req.query.collection;
  if (!isCollection(name)) {
    res.status(404).json({ error: 'Unknown collection' });
    return;
  }

  const c = collection(name);
  try {
    // The owner comes from the session, never from the request body.
    const row = await c.table.create({ data: { ...c.input(req.body), userId } });
    res.status(201).json(c.output(row));
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});
