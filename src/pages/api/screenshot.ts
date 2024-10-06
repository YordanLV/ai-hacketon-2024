import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url } = req.body;

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto(url);
      const screenshot = await page.screenshot({ encoding: 'base64' });
      await browser.close();

      res.status(200).json({ screenshot });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      res.status(500).json({ error: 'Failed to capture screenshot' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}