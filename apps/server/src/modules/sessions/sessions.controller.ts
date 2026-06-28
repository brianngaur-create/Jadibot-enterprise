import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/response';
import { sessionsService } from './sessions.service';

function actor(req: Request) {
  return { id: req.auth!.id, role: req.auth!.role };
}

export const sessionsController = {
  async list(req: Request, res: Response) {
    const sessions = await sessionsService.list(actor(req));
    return sendSuccess(res, sessions, 'Sessions');
  },
  async create(req: Request, res: Response) {
    const data = await sessionsService.create(req.body.botId, actor(req));
    return sendSuccess(res, data, 'Session starting', 201);
  },
  async qr(req: Request, res: Response) {
    const data = await sessionsService.getQr(req.body.botId, actor(req));
    return sendSuccess(res, data, 'QR session');
  },
  async pairing(req: Request, res: Response) {
    const data = await sessionsService.pairingCode(req.body.botId, req.body.phoneNumber, actor(req));
    return sendSuccess(res, data, 'Pairing code requested');
  },
  async reconnect(req: Request, res: Response) {
    const data = await sessionsService.reconnect(req.body.botId, actor(req));
    return sendSuccess(res, data, 'Reconnecting');
  },
  async disconnect(req: Request, res: Response) {
    const data = await sessionsService.disconnect(req.body.botId, actor(req));
    return sendSuccess(res, data, 'Disconnected');
  },
  async logout(req: Request, res: Response) {
    const data = await sessionsService.logout(req.body.botId, actor(req));
    return sendSuccess(res, data, 'Logged out');
  },
  async destroy(req: Request, res: Response) {
    await sessionsService.destroy(req.params.id, actor(req));
    return sendSuccess(res, null, 'Session deleted');
  },
};
