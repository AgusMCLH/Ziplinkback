import CustomRouter from './custom/custom.router.js';
import linkService from '../service/links.service.js';
import linkClickService from '../service/linkClick.service.js';
import { UAParser } from 'ua-parser-js';

export default class RedirectRouter extends CustomRouter {
  init() {
    this.get('/:id', ['API'], [], async (req, res) => {
      const { id } = req.params;
      const referer = req.query.referer || 'None';
      console.log(req.params);
      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      if (!result) {
        return res.status(400).send('Invalid user agent');
      }
      const response = await linkService.getLinkByShortCode(id);
      if (response.errorBool) {
        return res.status(response.errorStatus).send(response.errorMSG);
      }

      await linkClickService.logClick(response._id, result, referer, req.ip);
      res.status(200).json({
        originalUrl: response.originalUrl,
        userAgent: result,
      });
    });
  }
}
