import LinkClick from '../../models/linkClick.model.js';
import linkDAO from './link.DAO.js';

class LinkClickDAO {
  async createLinkClick(linkId, { ua, browser, deviceType, referer, ip }) {
    console.log({ ua, browser, deviceType, referer, ip });

    const [doc] = await LinkClick.create([
      {
        link: linkId,
        ip: ip,
        userAgent: ua,
        referer: referer,
        browser: browser,
        deviceType: deviceType,
      },
    ]);
    return doc;
  }

  async getAllLinkClicksByUserId(userId) {
    const linksByUser = await linkDAO.getLinksByUserID(userId);
    const linkIds = linksByUser.map((link) => link._id);
    const clicks = await LinkClick.find({ link: { $in: linkIds } }).lean();
    return clicks;
  }

  async getLinkClicks(linkId) {
    const clicks = await LinkClick.find({ link: linkId }).lean();
    return clicks;
  }
}

const linkClickDAO = new LinkClickDAO();

export default linkClickDAO;
