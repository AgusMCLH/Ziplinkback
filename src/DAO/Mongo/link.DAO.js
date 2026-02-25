import Link from './../../models/link.model.js';

class LinkDAO {
  async findByShortCode(shortCode) {
    return Link.findOne({ shortCode }).exec();
  }

  async createLink(originalUrl, user, totalClicks, code, expireAt) {
    console.log(originalUrl, user, totalClicks, code, expireAt);

    const [doc] = await Link.create([
      { originalUrl, user, totalClicks, shortCode: code, expireAt },
    ]);
    return doc;
  }
}

const linkDAO = new LinkDAO();

export default linkDAO;
