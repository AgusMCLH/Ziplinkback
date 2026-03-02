import CustomRouter from './custom/custom.router.js';
import linkService from '../service/links.service.js';
import { UAParser } from 'ua-parser-js';

export default class RedirectRouter extends CustomRouter {
  init() {
    this.get('/:id', ['PUBLIC'], [], async (req, res) => {
      const { id } = req.params;
      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      if (!result) {
        return res.status(400).send('Invalid user agent');
      }
      console.log(result);

      const response = await linkService.getLinkByShortCode(id);

      if (response.errorBool) {
        return res.status(response.errorStatus).send(response.errorMSG);
      }
      res.send(`Redirecting to link with id ${response.originalUrl}`);
    });
  }
}
