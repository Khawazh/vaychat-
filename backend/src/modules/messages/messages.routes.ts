import { Router } from 'express';
import { z } from 'zod';
import { MessageType } from '@prisma/client';
import { messagesService } from './messages.service.js';
import { authenticate, type AuthRequest } from '../../middleware/auth.js';
import { paramId } from '../../utils/params.js';

const router = Router();
router.use(authenticate);

router.get('/:chatId', async (req: AuthRequest, res, next) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const messages = await messagesService.getMessages(
      paramId(req.params.chatId),
      req.user!.id,
      cursor,
      Math.min(limit, 100)
    );
    res.json({ messages });
  } catch (e) {
    next(e);
  }
});

router.post('/:chatId', async (req: AuthRequest, res, next) => {
  try {
    const body = z
      .object({
        type: z.nativeEnum(MessageType).optional(),
        content: z.string().max(10000).optional(),
        encryptedContent: z.string().optional(),
        mediaUrl: z.string().url().optional(),
        replyToId: z.string().optional(),
        forwardedFromId: z.string().optional(),
      })
      .parse(req.body);
    const message = await messagesService.sendMessage(
      paramId(req.params.chatId),
      req.user!.id,
      body
    );
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});

router.patch('/:messageId', async (req: AuthRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const message = await messagesService.editMessage(
      paramId(req.params.messageId),
      req.user!.id,
      content
    );
    res.json(message);
  } catch (e) {
    next(e);
  }
});

router.delete('/:messageId', async (req: AuthRequest, res, next) => {
  try {
    await messagesService.deleteMessage(paramId(req.params.messageId), req.user!.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

router.post('/read', async (req: AuthRequest, res, next) => {
  try {
    const { messageIds } = z.object({ messageIds: z.array(z.string()) }).parse(req.body);
    const result = await messagesService.markAsRead(messageIds, req.user!.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:messageId/reactions', async (req: AuthRequest, res, next) => {
  try {
    const { emoji } = z.object({ emoji: z.string().min(1).max(8) }).parse(req.body);
    const reaction = await messagesService.addReaction(
      paramId(req.params.messageId),
      req.user!.id,
      emoji
    );
    res.json(reaction);
  } catch (e) {
    next(e);
  }
});

router.post('/:chatId/pin/:messageId', async (req: AuthRequest, res, next) => {
  try {
    const pinned = await messagesService.pinMessage(
      paramId(req.params.chatId),
      paramId(req.params.messageId),
      req.user!.id
    );
    res.json(pinned);
  } catch (e) {
    next(e);
  }
});

export default router;
