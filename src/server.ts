import express from 'express';
import cors from 'cors';
import colors from 'colors';
import morgan from 'morgan';
import { corsConfig } from './config/cors';

const app = express();

// CORS middleware
app.use(cors(corsConfig));

app.use(morgan('dev'))

app.use(express.json())

export default app