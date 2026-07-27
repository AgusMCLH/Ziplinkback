import CustomRouter from './custom/custom.router.js';
import linkService from '../service/links.service.js';
import linkClickService from '../service/linkClick.service.js';
import { UAParser } from 'ua-parser-js';
import userService from '../service/users.service.js';

export default class RedirectRouter extends CustomRouter {
  init() {
    this.get('/:id', ['API'], [], async (req, res) => {
      const { id } = req.params;
      const response = await linkService.getLinkByShortCode(id);
      if (response.errorBool) {
        return res
          .status(response.errorStatus)
          .json({ error: true, message: response.errorMSG, code: 'LINK-404' });
      }

      const isExpired = response.expireAt && response.expireAt.getTime() < Date.now();
      if (!response.active || isExpired) {
        return res.status(410).json({
          error: true,
          message: 'Link inactive or expired',
          code: 'LINK-410',
          linkName: response.name,
        });
      }

      const user = await userService.getUserById(response.user);
      res.status(200).json({
        error: false,
        message: null,
        code: null,
        linkName: response.name,
        userName: user?.name ?? null,
        originalUrl: response.originalUrl,
      });
    });

    this.post('/:id', ['API'], [], async (req, res) => {
      const { id } = req.params;
      const internalReferrer = req.body?.internalReferrer || 'None';
      const personalReferrer = req.body?.personalReferrer || 'None';
      const country = String(req.body?.country || 'Unknown').slice(0, 100);
      const city = String(req.body?.city || 'Unknown').slice(0, 100);

      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      if (!result) {
        return res.status(400).send('Invalid user agent');
      }
      const response = await linkService.getLinkByShortCode(id);
      if (response.errorBool) {
        return res.status(response.errorStatus).json({ error: true, message: response.errorMSG });
      }

      await linkClickService.logClick(response._id, result, internalReferrer, personalReferrer, req.ip, country, city);
      res.status(200).json({ ok: true });
    });
  }
}
