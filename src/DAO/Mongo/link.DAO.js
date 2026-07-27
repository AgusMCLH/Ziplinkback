import Link from './../../models/link.model.js';

class LinkDAO {
  async findByShortCode(shortCode) {
    return Link.findOne({ shortCode }).exec();
  }

  async createLink(originalUrl, name, status, user, totalClicks, code, expireAt) {
    const [doc] = await Link.create([
      {
        originalUrl,
        name,
        active: status,
        user,
        totalClicks,
        shortCode: code,
        expireAt,
      },
    ]);
    return doc;
  }

  async getLinkById(id) {
    return Link.findById(id).exec();
  }

  async getLinksByUserID(userID) {
    return Link.find({ user: userID }).exec();
  }

  async getLinkByLinkIDandUserID(linkId, userID) {
    const result = await Link.findOne({
      originalUrl: { $eq: linkId },
      user: userID,
    }).exec();
    return result ?? null;
  }

  async updateClickCount(linkId) {
    return await this.updateLink(linkId, { $inc: { totalClicks: 1 } });
  }

  async updateLink(linkId, updateData) {
    return await Link.findByIdAndUpdate(linkId, updateData, {
      new: true,
    }).exec();
  }

  async deleteLink(id) {
    return Link.findByIdAndDelete(id).exec();
  }

  async getLinksDataByUserID(userID) {
    return Link.find({ user: userID }).select('name shortCode totalClicks active').exec();
  }
}

const linkDAO = new LinkDAO();

export default linkDAO;
