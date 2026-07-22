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
      const user = await userService.getUserById(response.user);
      if (response.errorBool) {
        return res
          .status(response.errorStatus)
          .json({ error: true, messagge: response.errorMSG, code: 'LINK-404' });
      }
      if (!response.active || response.expireAt < new Date()) {
        console.log('El link no esta activo \n', {
          error: true,
          messagge: response.errorMSG,
          code: 'LINK-410',
          linkName: response.name,
          userName: user.name,
        });

        return res.status(410).json({
          error: true,
          messagge: response.errorMSG,
          code: 'LINK-410',
          linkName: response.name,
          userName: user.name,
        });
      }

      res.status(200).json({
        error: false,
        messagge: null,
        code: null,
        linkName: response.name,
        userName: user.name,
        originalUrl: response.originalUrl,
      });
    });

    this.post('/:id', ['API'], [], async (req, res) => {
      const { id } = req.params;
      const internalReferrer = req.body?.internalReferrer || 'None';
      const personalReferrer = req.body?.personalReferrer || 'None';
      const country = req.body?.country || 'Unknown';
      const city = req.body?.city || 'Unknown';

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

      await linkClickService.logClick(response._id, result, internalReferrer, personalReferrer, req.ip, country, city);
      res.status(200).json({ ok: true });
    });
  }
}
