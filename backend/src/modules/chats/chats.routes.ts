import { Router } from 'express';
import { z } from 'zod';
import { chatsService } from './chats.service.js';
import { authenticate, type AuthRequest } from '../../middleware/auth.js';
import { paramId } from '../../utils/params.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const chats = await chatsService.getUserChats(req.user!.id);
    res.json({ chats });
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req: AuthRequest, res, next) => {
  try {
    const q = z.string().min(1).parse(req.query.q);
    const chats = await chatsService.searchChats(req.user!.id, q);
    res.json({ chats });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const chat = await chatsService.getChat(paramId(req.params.id), req.user!.id);
    res.json(chat);
  } catch (e) {
    next(e);
  }
});

router.post('/private', async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body);
    const chat = await chatsService.createPrivateChat(req.user!.id, userId);
    res.status(201).json({ chat });
  } catch (e) {
    next(e);
  }
});

router.post('/group', async (req: AuthRequest, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(128),
        memberIds: z.array(z.string()).min(1),
      })
      .parse(req.body);
    const chat = await chatsService.createGroup(req.user!.id, body.title, body.memberIds);
    res.status(201).json(chat);
  } catch (e) {
    next(e);
  }
});

router.post('/channel', async (req: AuthRequest, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(128),
        description: z.string().max(1000).optional(),
      })
      .parse(req.body);
    const chat = await chatsService.createChannel(req.user!.id, body.title, body.description);
    res.status(201).json({ chat });
  } catch (e) {
    next(e);
  }
});

router.delete('/:chatId', async (req: AuthRequest, res, next) => {
  try {
    await chatsService.leaveChat(paramId(req.params.chatId), req.user!.id);
    res.json({ message: 'Left chat' });
  } catch (e) {
    next(e);
  }
});

router.post('/:chatId/members', async (req: AuthRequest, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body);
    const chatId = paramId(req.params.chatId);
    await chatsService.addMember(chatId, req.user!.id, userId);

    const io = req.app.get('io');
    if (io) {
      const chat = await chatsService.getChat(chatId, userId);
      if (chat) {
        io.to(`user:${userId}`).emit('chat:added', {
          chat: {
            id: chat.id,
            title: chat.title,
            type: chat.type,
          },
        });
      }
    }

    res.json({ message: 'Member added' });
  } catch (e) {
    next(e);
  }
});

export default router;
