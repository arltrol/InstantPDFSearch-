import express from 'express';
import puppeteer from 'puppeteer';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/fetchpdf', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('❌ URL is required');
  }

  try {
    console.log(`🌐 Visiting target: ${targetUrl}`);

    // Bypass Puppeteer for direct PDF/ashx links
    let pdfUrl;
    if (targetUrl.endsWith('.pdf') || targetUrl.endsWith('.ashx')) {
      pdfUrl = targetUrl;
    } else {
      // Use Puppeteer to scrape PDF link from HTML page
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });

      pdfUrl = await page.evaluate(() => {
        const link = document.querySelector('a[href$=".pdf"]')?.href;
        const iframe = document.querySelector('iframe[src$=".pdf"]')?.src;
        const meta = document.querySelector('meta[http-equiv="refresh"]')?.content;
        const metaMatch = meta?.match(/url=(.*\.pdf)/i);
        return link || iframe || (metaMatch ? metaMatch[1] : null);
      });

      await browser.close();
    }

    console.log(`📎 Detected PDF URL: ${pdfUrl}`);

    if (!pdfUrl) {
      return res.status(404).send('❌ No .pdf link found on page');
    }

    const pdfRes = await axios.get(pdfUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    pdfRes.data.pipe(res);
  } catch (err) {
    console.error('❌ Error fetching PDF:', err.message);
    res.status(500).send('❌ Error fetching PDF');
  }
});

app.get('/', (req, res) => {
  res.send('📄 PDF Proxy is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
