import { Router } from 'express';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/check', async (_req, res) => {
  try {
    const result = db.select().from(settings).where(eq(settings.key, 'access_password')).get();
    const password = result?.value || '';
    res.json({ required: password.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const result = db.select().from(settings).where(eq(settings.key, 'access_password')).get();
    const storedPassword = result?.value || '';

    if (storedPassword.length === 0) {
      return res.json({ success: true });
    }

    res.json({ success: password === storedPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
