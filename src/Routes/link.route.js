import CustomRouter from './custom/custom.router.js';
import linkService from '../service/links.service.js';
import { createLinkSchema } from '../validations/link.validation.js';

export default class LinkRouter extends CustomRouter {
  init() {
    this.get('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const links = await linkService.getLinksByUserID(userId);
      res.send(links);
    });

    this.post('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const linkURL = req.body.linkURL || '';
      const name = req.body.name || '-NO NAME PROVIDED-';
      const status = req.body.status;
      console.log('link: ', linkURL);

      const isUrlValid = createLinkSchema.safeParse({ linkURL });
      if (!isUrlValid.success) {
        return res.status(400).send({
          errorBool: true,
          errorStatus: 400,
          message: 'Formato de URL invalido',
        });
      }

      const urlAlreadyExists = await linkService.getLinkByLinkIDandUserID(
        linkURL,
        userId,
      );
      if (urlAlreadyExists) {
        return res.status(201).send({
          userId: urlAlreadyExists.user,
          shortCode: urlAlreadyExists.shortCode,
          dupl: true,
        });
      }

      const response = await linkService.createLink({
        originalURL: isUrlValid.data.linkURL,
        name,
        status,
        userID: userId,
      });
      res.status(201).send({ userId, shortCode: response.shortCode });
    });

    this.put('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const { updateLinkId, active } = req.body;

      const urlToUpdate = await linkService.getLinkById(updateLinkId);
      if (!urlToUpdate) {
        return res.status(404).send({
          errorBool: true,
          errorStatus: 404,
          message: 'Link not found',
        });
      }
      const isUrlOwned = await linkService.getLinkByLinkIDandUserID(
        urlToUpdate.originalUrl,
        userId,
      );

      if (!isUrlOwned) {
        return res.status(404).send({
          errorBool: true,
          errorStatus: 404,
          message: 'Link not found',
        });
      }
      const updatedLink = await linkService.updateLink(updateLinkId, {
        active: active,
      });
      res.send(updatedLink);
    });

    this.delete('/', ['PUBLIC'], [], async (req, res) => {
      res.send(`Delete link with id ${req.params.id}`);
    });
  }
}
