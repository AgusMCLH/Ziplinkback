import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userDAO from './../DAO/Mongo/user.DAO.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET;

class UserService {
  constructor() {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured in environment variables');
    }
  }

  async getUserById(userId) {
    return userDAO.findById(userId);
  }

  async register({ email, password }) {
    if (!this.#validateEmail(email)) {
      return {
        errorBool: true,
        errorMSG: 'Invalid email format',
        errorStatus: 400,
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const exists = await userDAO.existsByEmail(normalizedEmail);
    if (exists)
      return {
        errorBool: true,
        errorMSG: 'Email already in use',
        errorStatus: 409,
      };

    const hashed = await bcrypt.hash(password, 10);

    const user = await userDAO.create({
      email: normalizedEmail,
      password: hashed,
    });

    return {
      user: { _id: user._id, email: user.email, createdAt: user.createdAt },
    };
  }

  async login({ email, password }) {
    if (!this.#validateEmail(email)) {
      return { errorBool: true, error: 'Invalid email format' };
    }
    try {
      if (!JWT_SECRET) {
        return {
          errorBool: true,
          errorStatus: 500,
          message: 'JWT_SECRET not configured',
        };
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await userDAO.findByEmail(normalizedEmail, {
        includePassword: true,
      });

      if (!user) {
        return {
          errorBool: true,
          errorStatus: 401,
          message: 'Invalid credentials',
        };
      }

      const ok = await bcrypt.compare(String(password), user.password);
      if (!ok) {
        return {
          errorBool: true,
          errorStatus: 401,
          message: 'Invalid credentials',
        };
      }

      const token = jwt.sign({ sub: String(user._id) }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return {
        errorBool: false,
        message: 'Login success',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            createdAt: user.createdAt,
          },
          token,
        },
      };
    } catch (err) {
      return {
        errorBool: true,
        errorStatus: 500,
        message: 'Internal server error',
      };
    }
  }

  #validateEmail(email) {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(email);
  }

  _signToken(userId) {
    return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }
}

const userService = new UserService();

export default userService;
