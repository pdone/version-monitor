import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { settings } from '../db/schema';
import { defaultWebhookBody, defaultNtfyBody, defaultVocechatBody, sendTestNotification } from '../services/notification';
import { refreshGlobalCronSchedule } from '../services/scheduler';

const router = Router();

const updateSettingsSchema = z.record(z.string());

router.get('/', async (_req: Request, res: Response) => {
  try {
    const allSettings = db.select().from(settings).all();
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value || '';
    }
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/defaults', async (_req: Request, res: Response) => {
  res.json({
    webhook_body: defaultWebhookBody,
    ntfy_body: defaultNtfyBody,
    vocechat_body: defaultVocechatBody,
  });
});

router.post('/test-notification', async (req: Request, res: Response) => {
  try {
    const channel = req.body?.channel as string | undefined;
    const templates = req.body?.templates as Record<string, string> | undefined;
    const result = await sendTestNotification(channel, templates);
    if (result.success) {
      res.json({ message: 'Test notification sent successfully' });
    } else {
      res.status(207).json({ message: 'Some notifications failed', errors: result.errors });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const body = updateSettingsSchema.parse(req.body);

    for (const [key, value] of Object.entries(body)) {
      db.insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value },
        })
        .run();
    }

    if ('global_cron' in body) {
      refreshGlobalCronSchedule();
    }

    const allSettings = db.select().from(settings).all();
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value || '';
    }
    res.json(settingsMap);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
