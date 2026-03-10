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

      const isUrlValid = createLinkSchema.safeParse({ linkURL });
      if (!isUrlValid.success) {
        return res.status(400).send('Formato de URL invalido');
      }

      const urlAlreadyExists = await linkService.getLinkByLinkIDandUserID(
        linkURL,
        userId,
      );
      if (urlAlreadyExists) {
        return res.status(201).send({
          userId: urlAlreadyExists.user,
          link:
            'http://' + process.env.DOMAIN + '/r/' + urlAlreadyExists.shortCode,
          dupl: true,
        });
      }

      const response = await linkService.createLink({
        originalURL: isUrlValid.data.linkURL,
        userID: userId,
      });
      console.log(response);
      const link = 'http://' + process.env.DOMAIN + '/r/' + response.shortCode;
      res.status(201).send({ userId, link });
    });

    this.put('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const { updateLinkId, active } = req.body;
      console.log(userId, updateLinkId, active);

      const urlToUpdate = await linkService.getLinkById(updateLinkId);

      const isUrlOwned = await linkService.getLinkByLinkIDandUserID(
        urlToUpdate.originalUrl,
        userId,
      );
      console.log(isUrlOwned);

      if (!isUrlOwned) {
        return res.status(404).send('Link not found');
      }
      const updatedLink = await linkService.updateLink(updateLinkId, {
        active: active,
      });
      res.send(updatedLink);
    });

    this.delete('/:id', ['PUBLIC'], [], async (req, res) => {
      res.send(`Delete link with id ${req.params.id}`);
    });
  }
}
