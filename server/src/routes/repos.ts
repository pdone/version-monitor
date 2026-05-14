import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as repoService from '../services/repo';

const router = Router();

const addRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  useGlobalCron: z.boolean().optional().default(true),
  cronExpression: z.string().optional(),
});

const updateRepoSchema = z.object({
  isActive: z.boolean().optional(),
  useGlobalCron: z.boolean().optional(),
  cronExpression: z.string().optional(),
  localVersion: z.string().optional(),
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const repos = await repoService.getAllRepos();
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const repo = await repoService.getRepoById(id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.json(repo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = addRepoSchema.parse(req.body);
    const repo = await repoService.addRepo(body.owner, body.repo, body.useGlobalCron, body.cronExpression);
    res.status(201).json(repo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message === 'Repository already exists') {
        return res.status(409).json({ error: error.message });
      }
      if (error.message === 'Repository not found on GitHub') {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to add repository' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const body = updateRepoSchema.parse(req.body);
    const repo = await repoService.updateRepo(id, body);
    res.json(repo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Repository not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update repository' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await repoService.deleteRepo(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Repository not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

router.post('/:id/mark-updated', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const repo = await repoService.markRepoUpdated(id);
    res.json(repo);
  } catch (error) {
    if (error instanceof Error && error.message === 'Repository not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to mark repository as updated' });
  }
});

router.post('/:id/check', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const repo = await repoService.triggerCheck(id);
    res.json(repo);
  } catch (error) {
    if (error instanceof Error && error.message === 'Repository not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to check repository' });
  }
});

export default router;
