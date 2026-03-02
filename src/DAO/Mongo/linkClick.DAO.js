import LinkClick from '../../models/linkClick.model.js';

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
}

const linkClickDAO = new LinkClickDAO();

export default linkClickDAO;
