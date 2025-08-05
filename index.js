import express from 'express';
import fetch from 'node-fetch';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/fetchpdf', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('❌ URL is required');
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  const pdfUrl = await page.evaluate(() => {
  const link = document.querySelector('a[href$=".pdf"]')?.href;
  const iframe = document.querySelector('iframe[src$=".pdf"]')?.src;
  return link || iframe || null;
});


    await browser.close();

    if (!pdfUrl) {
      return res.status(404).send('❌ No .pdf link found on page');
    }

    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) throw new Error('Failed to fetch PDF');

    res.setHeader('Content-Type', 'application/pdf');
    pdfRes.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error fetching PDF');
  }
});

app.get('/', (req, res) => {
  res.send('📄 PDF Proxy is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
