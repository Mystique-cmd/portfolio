const express = require('express');

const app = express();
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.static(ROOT, { extensions: ['html'] }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));

