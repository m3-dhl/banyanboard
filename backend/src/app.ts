import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.routes';
import boardRouter from './routes/board.routes';
import cardRouter from './routes/card.routes';
import labelRouter from './routes/label.routes';
import { buildCorsOptions } from './config/cors';
import jsonErrorHandler from './middleware/json-error';

const app = express();

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(jsonErrorHandler);
app.use('/health', healthRouter);
app.use('/boards', boardRouter);
app.use('/cards', cardRouter);
app.use('/labels', labelRouter);

export default app;
