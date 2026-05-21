import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { usersService } from './users.service.js';
import { authenticate, type AuthRequest } from '../../middleware/auth.js';
import { paramId } from '../../utils/params.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const profile = await usersService.getProfile(req.user!.id);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.patch('/me', async (req: AuthRequest, res, next) => {
  try {
    const body = z
      .object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
        displayName: z.string().min(1).max(64).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
      })
      .parse(req.body);
    const profile = await usersService.updateProfile(req.user!.id, body);
    res.json({ user: profile });
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const users = await usersService.getAllUsers(req.user!.id);
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req: AuthRequest, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    const users = await usersService.searchUsers(q);
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const user = await usersService.getUserById(paramId(req.params.id), req.user!.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// multer setup with explicit types
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    const dir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, _file: any, cb: any) => {
    const ext = path.extname(_file.originalname);
    cb(null, `${req.user!.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

router.post('/me/avatar', upload.single('avatar'), async (req: AuthRequest, res, next) => {
  try {
    const file = (req as any).file;
    if (!file) throw new AppError(400, 'No file uploaded');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const updated = await usersService.updateProfile(req.user!.id, { avatarUrl });
    res.json({ user: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
