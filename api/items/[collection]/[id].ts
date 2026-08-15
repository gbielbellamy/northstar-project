import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withUser } from '../../_lib/auth.js';
import { collection, isCollection } from '../../_lib/collections.js';

/** Updates or deletes one row, provided it belongs to the signed-in user. */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  const name = req.query.collection;
  const id = req.query.id;
  if (!isCollection(name) || typeof id !== 'string') {
    res.status(404).json({ error: 'Unknown collection' });
    return;
  }

  const c = collection(name);

  // Scoping the write by userId as well as id is what stops one account
  // touching another's rows: a guessed id matches nothing.
  if (req.method === 'PATCH') {
    const result = await c.table.updateMany({
      where: { id, userId },
      data: c.input(req.body),
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(c.output(await c.table.findUnique({ where: { id } })));
    return;
  }

  if (req.method === 'DELETE') {
    const result = await c.table.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
