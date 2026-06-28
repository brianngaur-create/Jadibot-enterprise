import type { Request, Response } from 'express';
import { sendSuccess, paginationMeta } from '../../lib/response';
import type { ListQuery } from '../../utils/pagination';
import { botsService } from './bots.service';

function actor(req: Request) {
  return { id: req.auth!.id, role: req.auth!.role };
}

export const botsController = {
  async list(req: Request, res: Response) {
    const query = req.query as unknown as ListQuery;
    const { items, total } = await botsService.list(actor(req), query);
    return sendSuccess(res, items, 'Bots', 200, paginationMeta(total, query.page, query.pageSize));
  },

  async get(req: Request, res: Response) {
    const bot = await botsService.get(req.params.id, actor(req));
    return sendSuccess(res, bot, 'Bot');
  },

  async create(req: Request, res: Response) {
    const bot = await botsService.create(actor(req), req.body);
    return sendSuccess(res, bot, 'Bot created', 201);
  },

  async update(req: Request, res: Response) {
    const bot = await botsService.update(req.params.id, actor(req), req.body);
    return sendSuccess(res, bot, 'Bot updated');
  },

  async updateSettings(req: Request, res: Response) {
    const bot = await botsService.updateSettings(req.params.id, actor(req), req.body);
    return sendSuccess(res, bot, 'Bot settings updated');
  },

  async remove(req: Request, res: Response) {
    await botsService.remove(req.params.id, actor(req));
    return sendSuccess(res, null, 'Bot deleted');
  },

  async restart(req: Request, res: Response) {
    await botsService.restart(req.params.id, actor(req));
    return sendSuccess(res, null, 'Bot restarting');
  },
};
