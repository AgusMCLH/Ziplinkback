import CustomRouter from './custom/custom.router.js';
import linkService from '../service/links.service.js';
import userService from '../service/users.service.js';
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
      const { updateLinkId, active, name, originalUrl } = req.body;

      const urlToUpdate = await linkService.getLinkById(updateLinkId);
      if (!urlToUpdate) {
        return res.status(404).send({ errorBool: true, errorStatus: 404, message: 'Link not found' });
      }
      if (urlToUpdate.user.toString() !== userId) {
        return res.status(403).send({ errorBool: true, errorStatus: 403, message: 'Forbidden' });
      }

      const updateFields = {};
      if (active !== undefined) updateFields.active = active;
      if (name !== undefined) updateFields.name = String(name).trim();
      if (originalUrl !== undefined) updateFields.originalUrl = originalUrl;

      // When reactivating a link, reset expireAt so the TTL index doesn't delete it
      if (active === true) {
        const user = await userService.getUserById(userId);
        const days = user?.plan === 'premium' ? 30 : 7;
        updateFields.expireAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      const updatedLink = await linkService.updateLink(updateLinkId, updateFields);
      res.send(updatedLink);
    });

    this.delete('/', ['USERS'], [], async (req, res) => {
      const { userId } = req;
      const { linkId } = req.body;

      if (!linkId) {
        return res.status(400).json({ errorBool: true, message: 'linkId is required' });
      }

      const link = await linkService.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ errorBool: true, message: 'Link not found' });
      }
      if (link.user.toString() !== userId) {
        return res.status(403).json({ errorBool: true, message: 'Forbidden' });
      }

      await linkService.deleteLink(linkId);
      res.json({ errorBool: false, message: 'Link deleted' });
    });
  }
}
