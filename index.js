import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/fetchpdf', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).send('❌ Valid URL is required');
  }

  try {
    console.log(`📡 Proxying PDF from: ${targetUrl}`);

    const pdfRes = await axios.get(targetUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/pdf'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    pdfRes.data.pipe(res);
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).send('❌ Error fetching PDF');
  }
});

app.get('/', (req, res) => {
  res.send('📄 PDF Proxy is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
