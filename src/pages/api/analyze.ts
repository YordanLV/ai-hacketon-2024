import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    responseLimit: '50mb',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url } = req.body;

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Capture screenshot
      const screenshot = await page.screenshot({ encoding: 'base64' });

      // Extract relevant DOM content
      const domContent = await page.evaluate(() => {
        const title = document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const h1s = Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent);
        const h2s = Array.from(document.querySelectorAll('h2')).map(h2 => h2.textContent);
        const links = Array.from(document.querySelectorAll('a')).map(a => ({ href: a.href, text: a.textContent }));
        const images = Array.from(document.querySelectorAll('img')).map(img => ({ src: img.src, alt: img.alt }));

        return { title, metaDescription, h1s, h2s, links, images };
      });

      await browser.close();

      // Analyze SEO using OpenAI
      const prompt = `Analyze the following website content for SEO optimizations:

Title: ${domContent.title}
Meta Description: ${domContent.metaDescription}
H1 Tags: ${JSON.stringify(domContent.h1s)}
H2 Tags: ${JSON.stringify(domContent.h2s)}
Links: ${JSON.stringify(domContent.links)}
Images: ${JSON.stringify(domContent.images)}

Provide specific SEO recommendations based on this content.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const seoRecommendations = response.choices[0].message.content;

      res.status(200).json({ screenshot, seoRecommendations });
    } catch (error) {
      console.error('Error analyzing website:', error);
      res.status(500).json({ error: 'Failed to analyze website' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}