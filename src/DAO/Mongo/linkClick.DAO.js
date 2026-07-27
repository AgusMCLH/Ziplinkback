import mongoose from 'mongoose';
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

  async getCampaignsByLink(userId, linkId) {
    if (!mongoose.Types.ObjectId.isValid(linkId)) return null;

    const links = await linkDAO.getLinksByUserID(userId);
    const owned = links.find((l) => l._id.toString() === linkId);
    if (!owned) return null;

    const now = new Date();
    const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const oid = new mongoose.Types.ObjectId(linkId);

    const [result] = await LinkClick.aggregate([
      { $match: { link: oid, personalReferrer: { $nin: ['None', null, ''] } } },
      {
        $facet: {
          current: [
            { $match: { clickedAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$personalReferrer', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
          ],
          previous: [
            { $match: { clickedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
            { $group: { _id: '$personalReferrer', clicks: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const prevMap = new Map(
      (result?.previous || []).map(({ _id, clicks }) => [_id, clicks])
    );

    return (result?.current || []).map(({ _id, clicks }) => {
      const prev = prevMap.get(_id) ?? 0;
      return {
        campaign: _id,
        clicks,
        previousClicks: prev,
        trend: clicks > prev ? 'up' : clicks < prev ? 'down' : 'same',
      };
    });
  }

  async getClickDetail(userId, type, value) {
    const links = await linkDAO.getLinksByUserID(userId);
    const linkIds = links.map((l) => l._id);

    const field = type === 'campaign' ? 'personalReferrer' : 'internalReferrer';

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [result] = await LinkClick.aggregate([
      { $match: { link: { $in: linkIds }, [field]: value } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          chartData: [
            { $match: { clickedAt: { $gte: thirtyDaysAgo } } },
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
          byDevice: [
            { $group: { _id: '$deviceType', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
          ],
          byCountry: [
            { $group: { _id: '$country', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const chartMap = {};
    (result?.chartData || []).forEach(({ _id: { date, deviceType }, count }) => {
      if (!chartMap[date]) chartMap[date] = { date, desktop: 0, mobile: 0 };
      if (deviceType === 'mobile') chartMap[date].mobile += count;
      else chartMap[date].desktop += count;
    });

    return {
      totalClicks: result?.total[0]?.count ?? 0,
      chartData: Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date)),
      byDevice: (result?.byDevice || []).map(({ _id, clicks }) => ({
        device: _id || 'Unknown',
        clicks,
      })),
      byCountry: (result?.byCountry || []).map(({ _id, clicks }) => ({
        country: _id || 'Unknown',
        clicks,
      })),
    };
  }

  async getLinkStats(userId, linkId) {
    if (!mongoose.Types.ObjectId.isValid(linkId)) return null;

    const links = await linkDAO.getLinksByUserID(userId);
    const owned = links.find((l) => l._id.toString() === linkId);
    if (!owned) return null;

    const oid = new mongoose.Types.ObjectId(linkId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [result] = await LinkClick.aggregate([
      { $match: { link: oid } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byDevice: [
            { $group: { _id: '$deviceType', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
          ],
          chartData: [
            { $match: { clickedAt: { $gte: thirtyDaysAgo } } },
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
            { $limit: 5 },
          ],
          byReferrer: [
            { $match: { internalReferrer: { $nin: ['None', null, ''] } } },
            { $group: { _id: '$internalReferrer', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const total = result?.total[0]?.count ?? 0;
    const mobileClicks = (result?.byDevice || []).find((d) => d._id === 'mobile')?.clicks ?? 0;

    const chartMap = {};
    (result?.chartData || []).forEach(({ _id: { date, deviceType }, count }) => {
      if (!chartMap[date]) chartMap[date] = { date, desktop: 0, mobile: 0 };
      if (deviceType === 'mobile') chartMap[date].mobile += count;
      else chartMap[date].desktop += count;
    });

    return {
      totalClicks: total,
      mobilePercent: total > 0 ? Math.round((mobileClicks / total) * 100) : 0,
      desktopPercent: total > 0 ? Math.round(((total - mobileClicks) / total) * 100) : 0,
      chartData: Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date)),
      byCountry: (result?.byCountry || []).map(({ _id, clicks }) => ({ code: _id || 'Unknown', clicks })),
      byCampaign: (result?.byCampaign || []).map(({ _id, clicks }) => ({ personalReferrer: _id, clicks })),
      byReferrer: (result?.byReferrer || []).map(({ _id, clicks }) => ({ referrer: _id, clicks })),
    };
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

    const statsRaw = result?.allTimeStats?.[0] || { totalClicks: 0, mobileClicks: 0 };
    const totalClicks = statsRaw.totalClicks;
    const mobilePercent = totalClicks > 0
      ? Math.round((statsRaw.mobileClicks / totalClicks) * 100)
      : 0;

    const chartMap = {};
    (result?.chartData || []).forEach(({ _id: { date, deviceType }, count }) => {
      if (!chartMap[date]) chartMap[date] = { date, desktop: 0, mobile: 0 };
      if (deviceType === 'mobile') chartMap[date].mobile += count;
      else chartMap[date].desktop += count;
    });

    return {
      stats: {
        totalClicks,
        mobilePercent,
        activeLinks,
        expiredLinks,
        topReferrer: result?.byReferrer?.[0]?._id || 'None',
      },
      chartData: Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date)),
      byCountry: (result?.byCountry || []).map(({ _id, clicks }) => ({ code: _id, clicks })),
      byCampaign: (result?.byCampaign || []).map(({ _id, clicks }) => ({ personalReferrer: _id, clicks })),
      byReferrer: (result?.byReferrer || []).map(({ _id, clicks }) => ({ referrer: _id, clicks })),
    };
  }
}

const linkClickDAO = new LinkClickDAO();

export default linkClickDAO;
