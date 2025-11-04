import { CorsOptions } from 'cors';

export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    const whitelist = [process.env.FRONTEND_URL];

    // Add Postman client to the whitelist
    if (process.argv[2] === '--api') {
      whitelist.push(undefined);
    }

    // Check if the origin is in the whitelist
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
