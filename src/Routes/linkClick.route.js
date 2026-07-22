import CustomRouter from './custom/custom.router.js';
import linkClickDAO from '../DAO/Mongo/linkClick.DAO.js';
import linkClickService from '../service/linkClick.service.js';

export default class LinkClickRouter extends CustomRouter {
  init() {
    this.get('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const clicks = await linkClickDAO.getAllLinkClicksByUserId(userId);
      res.send(clicks);
    });

    this.get('/summary', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const summary = await linkClickService.getSummary(userId);
      res.json(summary);
    });

    this.get('/campaigns', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const { linkId } = req.query;
      if (!linkId) return res.status(400).json({ error: 'Missing linkId' });
      const result = await linkClickDAO.getCampaignsByLink(userId, linkId);
      if (result === null) return res.status(403).json({ error: 'Forbidden' });
      res.json(result);
    });

    this.get('/link-stats', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const { linkId } = req.query;
      if (!linkId) return res.status(400).json({ error: 'Missing linkId' });
      const result = await linkClickDAO.getLinkStats(userId, linkId);
      if (result === null) return res.status(403).json({ error: 'Forbidden' });
      res.json(result);
    });

    this.get('/detail', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const { type, value } = req.query;
      if (!type || !value || !['campaign', 'referrer'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type or value' });
      }
      const detail = await linkClickDAO.getClickDetail(userId, type, value);
      res.json(detail);
    });
  }
}
