import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleLoginRequest } from './server/loginHandler.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. Trusted Login Endpoint with Rate Limiting
app.post('/api/login', async (req, res) => {
  try {
    const { employeeId, password } = req.body || {};
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const result = await handleLoginRequest({
      employeeId,
      password,
      clientIp,
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// 2. Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'outFyt Work Management Portal' });
});

// 3. Static assets and SPA fallback
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`outFyt Portal server listening on port ${PORT}`);
});
