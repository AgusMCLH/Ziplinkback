import CustomRouter from './custom/custom.router.js';
import linkService from '../service/links.service.js';
import { createLinkSchema } from '../validations/link.validation.js';

export default class LinkRouter extends CustomRouter {
  init() {
    this.get('/', ['USERS'], [], async (req, res) => {
      res.send('Get all ');
    });

    this.post('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const linkURL = req.body.linkURL || '';

      const validation = createLinkSchema.safeParse({ linkURL });
      if (!validation.success) {
        return res.status(400).send('Formato de URL invalido');
      }
      const response = await linkService.createLink({
        originalURL: validation.data.linkURL,
        userID: userId,
      });
      console.log(response);

      res.status(201).send({ userId, linkURL: validation.data.linkURL });
    });

    this.get('/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Get link with id ${req.params.id}`);
    });

    this.put('/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Update link with id ${req.params.id}`);
    });

    this.delete('/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Delete link with id ${req.params.id}`);
    });
  }
}
