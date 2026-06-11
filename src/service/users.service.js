import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userDAO from './../DAO/Mongo/user.DAO.js';
import sessionService from './sessions.service.js';

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

  async register({ email, password, name }) {
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
      name: name ? String(name).trim() : 'NO NAME',
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }

  async login({ email, password }) {
    try {
      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await userDAO.findByEmail(normalizedEmail, {
        includePassword: true,
      });

      if (!user) {
        return {
          errorBool: true,
          errorStatus: 401,
          errorMSG: 'Invalid credentials',
        };
      }

      const ok = await bcrypt.compare(String(password), user.password);
      if (!ok) {
        return {
          errorBool: true,
          errorStatus: 401,
          errorMSG: 'Invalid credentials',
        };
      }

      const session = await sessionService.createSession({ userID: user._id });

      const token = jwt.sign({ sub: String(user._id) }, JWT_SECRET, {
        //
        expiresIn: JWT_EXPIRES_IN, //
        algorithm: 'HS256', //
      }); //BORRAR CUANDO TERMINE LA MIGRACION
      const accessToken = jwt.sign(
        { sub: String(user._id), sessionId: String(session.sessionObject._id) },
        JWT_SECRET,
        {
          //
          expiresIn: '15m', //
          algorithm: 'HS256', //
        },
      );
      return {
        errorBool: false,
        errorMSG: 'Login success',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            createdAt: user.createdAt,
          },
          token, //
          sessionToken: session.sessionToken,
          accessToken,
        },
      };
    } catch (err) {
      return {
        errorBool: true,
        errorStatus: 500,
        errorMSG: 'Internal server error',
      };
    }
  }

  async getUserByJWTToken(token) {
    try {
      const keysToRemove = ['password', '__v', 'createdAt', 'updatedAt', '_id'];
      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      let user = await userDAO.findById(payload.sub);

      if (!user) {
        return null;
      }

      user = user.toObject();
      keysToRemove.forEach((key) => {
        delete user[key];
      });

      return user;
    } catch (err) {
      return null;
    }
  }

  #validateEmail(email) {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(email);
  }
}

const userService = new UserService();

export default userService;
