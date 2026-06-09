import express from 'express';
import healthRouter from './routes/health.routes';
import boardRouter from './routes/board.routes';

const app = express();

app.use(express.json());
app.use('/health', healthRouter);
app.use('/boards', boardRouter);

export default app;
