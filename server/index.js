import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import settingsRouter from './routes/settings.js';
import thesisRouter from './routes/thesis.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/analyze', analyzeRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/thesis', thesisRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
