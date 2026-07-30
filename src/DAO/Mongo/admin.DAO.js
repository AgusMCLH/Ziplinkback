import mongoose from 'mongoose';
import User from '../../models/user.model.js';
import Link from '../../models/link.model.js';
import LinkClick from '../../models/linkClick.model.js';
import Session from '../../models/session.model.js';

class AdminDAO {
  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(now -  7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast30d,
      totalLinks,
      activeLinks,
      totalClicks,
      clicksLast30d,
      activeSessions,
      topUsersByLinks,
      topUsersByClicks,
      clicksByDay,
      topCountries,
      topCampaigns,
      recentLinks,
    ] = await Promise.all([
      // ── Totals ──────────────────────────────────────────────────
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Link.countDocuments(),
      Link.countDocuments({ active: true, expireAt: { $gt: now } }),
      LinkClick.countDocuments(),
      LinkClick.countDocuments({ clickedAt: { $gte: thirtyDaysAgo } }),
      Session.countDocuments({ expiresAt: { $gt: now } }),

      // ── Top users by active link count ──────────────────────────
      Link.aggregate([
        { $match: { active: true, expireAt: { $gt: now } } },
        { $group: { _id: '$user', activeLinks: { $sum: 1 } } },
        { $sort: { activeLinks: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            name: '$user.name',
            email: '$user.email',
            plan: '$user.plan',
            activeLinks: 1,
          },
        },
      ]),

      // ── Top users by total clicks ────────────────────────────────
      Link.aggregate([
        { $group: { _id: '$user', totalClicks: { $sum: '$totalClicks' } } },
        { $sort: { totalClicks: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            name: '$user.name',
            email: '$user.email',
            plan: '$user.plan',
            totalClicks: 1,
          },
        },
      ]),

      // ── Clicks per day (last 30 days) ────────────────────────────
      LinkClick.aggregate([
        { $match: { clickedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', clicks: 1 } },
      ]),

      // ── Top countries ────────────────────────────────────────────
      LinkClick.aggregate([
        { $match: { country: { $nin: [null, '', 'Local'] } } },
        { $group: { _id: '$country', clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, country: '$_id', clicks: 1 } },
      ]),

      // ── Top campaigns ────────────────────────────────────────────
      LinkClick.aggregate([
        { $match: { personalReferrer: { $nin: ['None', null, ''] } } },
        { $group: { _id: '$personalReferrer', clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, campaign: '$_id', clicks: 1 } },
      ]),

      // ── Recently created links ───────────────────────────────────
      Link.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .lean(),
    ]);

    const expiredLinks = totalLinks - activeLinks;
    const clicksLast7d = await LinkClick.countDocuments({ clickedAt: { $gte: sevenDaysAgo } });

    return {
      overview: {
        totalUsers,
        newUsersLast30d,
        totalLinks,
        activeLinks,
        expiredLinks,
        totalClicks,
        clicksLast30d,
        clicksLast7d,
        activeSessions,
      },
      topUsersByLinks,
      topUsersByClicks,
      clicksByDay,
      topCountries,
      topCampaigns,
      recentLinks: recentLinks.map((l) => ({
        name: l.name,
        shortCode: l.shortCode,
        originalUrl: l.originalUrl,
        totalClicks: l.totalClicks,
        active: l.active,
        createdAt: l.createdAt,
        user: { name: l.user?.name, email: l.user?.email },
      })),
    };
  }

  async getAllUsers({ page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    // Attach link counts per user
    const userIds = users.map((u) => u._id);
    const linkCounts = await Link.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', total: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } } } },
    ]);
    const countMap = new Map(linkCounts.map((c) => [c._id.toString(), c]));

    return {
      total,
      page,
      pages: Math.ceil(total / limit),
      users: users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        disabled: u.disabled ?? false,
        createdAt: u.createdAt,
        totalLinks: countMap.get(u._id.toString())?.total ?? 0,
        activeLinks: countMap.get(u._id.toString())?.active ?? 0,
      })),
    };
  }

  async updateUser(userId, { plan, disabled }) {
    if (!mongoose.isValidObjectId(userId)) return null;
    const updates = {};
    if (plan !== undefined) updates.plan = plan;
    if (disabled !== undefined) updates.disabled = disabled;
    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).lean();
  }

  async getAllLinks({ page = 1, limit = 50, userId = null } = {}) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const filter = userId && mongoose.isValidObjectId(userId) ? { user: new mongoose.Types.ObjectId(userId) } : {};
    const [links, total] = await Promise.all([
      Link.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .lean(),
      Link.countDocuments(filter),
    ]);

    return {
      total,
      page,
      pages: Math.ceil(total / limit),
      links: links.map((l) => ({
        _id: l._id,
        name: l.name,
        shortCode: l.shortCode,
        originalUrl: l.originalUrl,
        totalClicks: l.totalClicks,
        active: l.active && (!l.expireAt || l.expireAt > now),
        expireAt: l.expireAt,
        createdAt: l.createdAt,
        user: { name: l.user?.name, email: l.user?.email },
      })),
    };
  }

  async updateLink(linkId, { active }) {
    if (!mongoose.isValidObjectId(linkId)) return null;
    const updates = {};
    if (active !== undefined) updates.active = active;
    return Link.findByIdAndUpdate(linkId, updates, { new: true }).lean();
  }
}

const adminDAO = new AdminDAO();
export default adminDAO;
