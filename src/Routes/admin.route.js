import CustomRouter from './custom/custom.router.js';
import adminDAO from '../DAO/Mongo/admin.DAO.js';

const ADMIN_EMAIL = 'agustindiazmclh@gmail.com';

async function requireAdmin(req, res, next) {
  const { default: userDAO } = await import('../DAO/Mongo/user.DAO.js');
  const user = await userDAO.findById(req.userId);
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ errorBool: true, message: 'Admin access only' });
  }
  next();
}

export default class AdminRouter extends CustomRouter {
  init() {
    this.get('/stats', ['API', 'USERS'], [requireAdmin], async (req, res) => {
      const stats = await adminDAO.getStats();
      return res.json({ errorBool: false, data: stats });
    });

    this.get('/users', ['API', 'USERS'], [requireAdmin], async (req, res) => {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
      const result = await adminDAO.getAllUsers({ page, limit });
      return res.json({ errorBool: false, data: result });
    });

    this.put('/users/:id', ['API', 'USERS'], [requireAdmin], async (req, res) => {
      const { id } = req.params;
      const { plan, disabled } = req.body;
      const allowed = {};
      if (plan !== undefined && ['standard', 'premium'].includes(plan)) allowed.plan = plan;
      if (disabled !== undefined) allowed.disabled = Boolean(disabled);
      if (Object.keys(allowed).length === 0) {
        return res.status(400).json({ errorBool: true, message: 'No valid fields to update' });
      }
      const updated = await adminDAO.updateUser(id, allowed);
      if (!updated) return res.status(404).json({ errorBool: true, message: 'User not found' });
      return res.json({ errorBool: false, data: updated });
    });

    this.get('/links', ['API', 'USERS'], [requireAdmin], async (req, res) => {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
      const userId = req.query.userId || null;
      const result = await adminDAO.getAllLinks({ page, limit, userId });
      return res.json({ errorBool: false, data: result });
    });

    this.put('/links/:id', ['API', 'USERS'], [requireAdmin], async (req, res) => {
      const { id } = req.params;
      const { active } = req.body;
      if (active === undefined) {
        return res.status(400).json({ errorBool: true, message: 'No valid fields to update' });
      }
      const updated = await adminDAO.updateLink(id, { active: Boolean(active) });
      if (!updated) return res.status(404).json({ errorBool: true, message: 'Link not found' });
      return res.json({ errorBool: false, data: updated });
    });
  }
}
