import express from 'express';
import request from 'supertest';
import { errorHandler, AppError } from '../middleware/errorHandler';

describe('errorHandler middleware', () => {
  it('handles AppError with custom status', async () => {
    const app = express();
    app.get('/boom', (_req, _res, next) => {
      next(new AppError('teapot', 418));
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ error: 'teapot', statusCode: 418 });
  });
});


