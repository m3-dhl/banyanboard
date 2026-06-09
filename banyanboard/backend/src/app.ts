import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.routes';
import boardRouter from './routes/board.routes';
import { buildCorsOptions } from './config/cors';

const app = express();

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use('/health', healthRouter);
app.use('/boards', boardRouter);

export default app;
