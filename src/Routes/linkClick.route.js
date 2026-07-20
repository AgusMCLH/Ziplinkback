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
  }
}
