import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

const readmeDir = path.join(__dirname, '../../..');

const readmeCache: Record<string, string> = {};

function getReadme(lang: string): string {
  const key = lang === 'zh' ? 'zh' : 'en';
  if (readmeCache[key]) {
    return readmeCache[key];
  }

  const filename = key === 'zh' ? 'README.zh.md' : 'README.md';
  const filePath = path.join(readmeDir, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    readmeCache[key] = content;
    return content;
  } catch {
    return key === 'zh' ? '# 暂无内容' : '# No content available';
  }
}

router.get('/', async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const content = getReadme(lang);
  res.json({ content });
});

export default router;
