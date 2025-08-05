import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/fetchpdf', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).send('❌ Valid URL is required');
  }

  try {
    const filename = `/tmp/fetched-${Date.now()}.pdf`;
    const command = `curl -L "${targetUrl}" --output "${filename}" --silent --show-error --fail`;

    console.log(`📡 Fetching via curl: ${targetUrl}`);
    await execAsync(command);

    if (!fs.existsSync(filename)) {
      return res.status(500).send('❌ File not downloaded');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = fs.createReadStream(filename);
    stream.pipe(res);

    stream.on('close', () => {
      fs.unlink(filename, () => {}); // cleanup
    });
  } catch (err) {
    console.error('❌ Curl error:', err.message);
    res.status(500).send('❌ Error fetching PDF via curl');
  }
});

app.get('/', (req, res) => {
  res.send('📄 PDF Proxy (via curl) is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Curl proxy server running on port ${PORT}`);
});
