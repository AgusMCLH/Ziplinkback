import express from 'express';
import config from './config/env.config.js';
import mongoose from 'mongoose';
import UserRouter from './Routes/user.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import LinkRouter from './Routes/link.route.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());

mongoose
  .connect(config.MONGO_URI, {
    dbName: config.DATABASE_NAME,
  })
  .then(() => console.log('Database connected!'))
  .catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/api/users', new UserRouter().getRouter());
app.use('/api/links', new LinkRouter().getRouter());

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});

export default app;
