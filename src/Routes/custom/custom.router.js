import { Router } from 'express';
import jwt from 'jsonwebtoken';

export default class CustomRouter {
  constructor() {
    this.router = Router();
    this.init();
  }

  init() {}

  getRouter() {
    return this.router;
  }

  get(path, policies, middlewares, ...callback) {
    this.router.get(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  post(path, policies, middlewares, ...callback) {
    this.router.post(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  put(path, policies, middlewares, ...callback) {
    this.router.put(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  delete(path, policies, middlewares, ...callback) {
    this.router.delete(
      path,
      this.#handlerPolicies(policies),
      this.#handelerMiddleware(middlewares),
      this.#applyCallback(callback),
    );
  }

  #applyCallback(callbacks) {
    if (callbacks.length > 1) {
      callbacks = [callbacks[callbacks.length - 1]]; //Si hay mas de un callback, se toma el ultimo
    }
    return callbacks.map((callback) => async (...params) => {
      try {
        await callback.apply(this, params); //Se ejecuta el callback
      } catch (error) {
        console.log(error);
        params[1].status(500).send({ status: 'Internal Server Error', error }); //Si hay un error, se muestra un mensaje de error
      }
    });
  }

  #handlerPolicies = (policies) => (req, res, next) => {
    policies = policies.length === 0 ? ['PUBLIC'] : policies; //Si no se especifica ninguna politica, se asigna PUBLIC por defecto
    if (policies[0] === 'PUBLIC') return next(); //Si la politica es PUBLIC, se permite el acceso sin verificar el token
    let evaluated = true;
    policies.forEach((policy) => {
      switch (policy) {
        case 'USERS':
          try {
            const token = req.cookies?.access_token;
            if (!token) {
              return (evaluated = false);
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = payload.sub;

            return;
          } catch (err) {
            return (evaluated = false);
          }
        case 'API':
          const apiKey = req.headers['x-api-key'];

          if (!apiKey || apiKey !== process.env.APIKEY) {
            return (evaluated = false);
          }
          return;
      }
    });
    if (!evaluated) {
      return res.status(403).json({
        status: 'Forbidden',
        message: "You don't have access to this resource",
      }); //Si no se cumple ninguna politica, se muestra un mensaje de error
    }
    next();

    // policies.forEach((politic) => {
    //   if (politic === user.role?.toUpperCase()) {
    //     req.user = user;
    //     valid = true;
    //   } //Se recorre el array de politicas y si el usuario tiene el rol, se permite el acceso
    // });

    // valid ? next() : console.log("Forbbidden, user doesn't have access"); //Si no tiene el rol, se muestra un mensaje de error

    // return;
  };

  #handelerMiddleware = (middlewares) => (req, res, next) => {
    if (middlewares.length === 0) {
      next(); //Si no hay middlewares, se pasa al siguiente
    }
    middlewares.forEach((middleware) => {
      middleware(req, res, next); //Se recorren los middlewares y se ejecutan
    });
  };
}
