import mongoose from 'mongoose';
import User from './../../models/user.model.js';

class UserDAO {
  async create({ email, password }, { session } = {}) {
    const [doc] = await User.create(
      [{ email, password }],
      session ? { session } : undefined,
    );
    return doc;
  }

  async findByEmail(email, { includePassword = false, session } = {}) {
    const q = User.findOne({ email: email.toLowerCase() });
    if (includePassword) q.select('+password');
    if (session) q.session(session);
    return q.exec();
  }

  async findById(userId, { includePassword = false, session } = {}) {
    if (!mongoose.isValidObjectId(userId)) return null;

    const q = User.findById(userId);
    if (includePassword) q.select('+password');
    if (session) q.session(session);
    return q.exec();
  }

  async existsByEmail(email, { session } = {}) {
    const q = User.exists({ email: email.toLowerCase() });
    if (session) q.session(session);
    return q.exec(); // devuelve null o { _id: ... }
  }

  async updateById(userId, updates, { session, returnNew = true } = {}) {
    if (!mongoose.isValidObjectId(userId)) return null;

    const q = User.findByIdAndUpdate(userId, updates, {
      new: returnNew,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(userId, { session } = {}) {
    if (!mongoose.isValidObjectId(userId)) return null;

    const q = User.findByIdAndDelete(userId);
    if (session) q.session(session);
    return q.exec();
  }
}

const userDAO = new UserDAO();

export default userDAO;
