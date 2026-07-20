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

  async getSummaryByUserId(userId) {
    const links = await linkDAO.getLinksByUserID(userId);
    const linkIds = links.map((l) => l._id);
    const activeLinks = links.filter((l) => l.active).length;
    const expiredLinks = links.filter((l) => !l.active).length;

    if (linkIds.length === 0) {
      return {
        stats: { totalClicks: 0, mobilePercent: 0, activeLinks, expiredLinks, topReferrer: 'None' },
        chartData: [],
        byCountry: [],
        byCampaign: [],
        byReferrer: [],
      };
    }

    console.log('[summary] userId:', userId, '| links found:', linkIds.length, '| IDs:', linkIds.map(String));

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [result] = await LinkClick.aggregate([
      { $match: { link: { $in: linkIds } } },
      {
        $facet: {
          allTimeStats: [
            {
              $group: {
                _id: null,
                totalClicks: { $sum: 1 },
                mobileClicks: { $sum: { $cond: [{ $eq: ['$deviceType', 'mobile'] }, 1, 0] } },
              },
            },
          ],
          chartData: [
            { $match: { clickedAt: { $gte: ninetyDaysAgo } } },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
                  deviceType: '$deviceType',
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.date': 1 } },
          ],
          byCountry: [
            { $group: { _id: '$country', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
          ],
          byCampaign: [
            { $match: { personalReferrer: { $nin: ['None', null, ''] } } },
            { $group: { _id: '$personalReferrer', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
          ],
          byReferrer: [
            { $match: { internalReferrer: { $nin: ['None', null, ''] } } },
            { $group: { _id: '$internalReferrer', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
          ],
        },
      },
    ]);

    console.log('[summary] allTimeStats:', result.allTimeStats, '| byCountry count:', result.byCountry.length, '| chartData count:', result.chartData.length);
    const statsRaw = result.allTimeStats[0] || { totalClicks: 0, mobileClicks: 0 };
    const totalClicks = statsRaw.totalClicks;
    const mobilePercent = totalClicks > 0
      ? Math.round((statsRaw.mobileClicks / totalClicks) * 100)
      : 0;

    const chartMap = {};
    result.chartData.forEach(({ _id: { date, deviceType }, count }) => {
      if (!chartMap[date]) chartMap[date] = { date, desktop: 0, mobile: 0 };
      if (deviceType === 'mobile') chartMap[date].mobile += count;
      else chartMap[date].desktop += count; // 'desktop', 'Unknown', 'tablet', etc.
    });

    return {
      stats: {
        totalClicks,
        mobilePercent,
        activeLinks,
        expiredLinks,
        topReferrer: result.byReferrer[0]?._id || 'None',
      },
      chartData: Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date)),
      byCountry: result.byCountry.map(({ _id, clicks }) => ({ code: _id, clicks })),
      byCampaign: result.byCampaign.map(({ _id, clicks }) => ({ personalReferrer: _id, clicks })),
      byReferrer: result.byReferrer.map(({ _id, clicks }) => ({ referrer: _id, clicks })),
    };
  }
}

const linkClickDAO = new LinkClickDAO();

export default linkClickDAO;
