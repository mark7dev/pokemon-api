import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { corsConfig } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import pokemonRouter from './routes/pokemonRouter';

const app = express();

// CORS middleware
app.use(cors(corsConfig));

app.use(morgan('dev'));

app.use(express.json());

app.use('/api/pokemons', pokemonRouter);

app.use(errorHandler);

export default app;
