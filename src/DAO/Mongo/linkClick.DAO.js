import LinkClick from '../../models/linkClick.model.js';
import linkDAO from './link.DAO.js';

class LinkClickDAO {
  async createLinkClick(linkId, { ua, browser, deviceType, internalReferrer, personalReferrer, ip, country, city }) {
    const [doc] = await LinkClick.create([
      {
        link: linkId,
        ip,
        userAgent: ua,
        internalReferrer,
        personalReferrer,
        browser,
        deviceType,
        country,
        city,
      },
    ]);
    return doc;
  }

  async getAllLinkClicksByUserId(userId) {
    const linksByUser = await linkDAO.getLinksByUserID(userId);
    const linkIds = linksByUser.map((link) => link._id);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const clicks = await LinkClick.find({
      link: { $in: linkIds },
      clickedAt: { $gte: ninetyDaysAgo },
    }).lean();

    return clicks;
  }

  async getLinkClicks(linkId) {
    const clicks = await LinkClick.find({ link: linkId }).lean();
    return clicks;
  }
}

const linkClickDAO = new LinkClickDAO();

export default linkClickDAO;
