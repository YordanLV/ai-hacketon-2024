import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';

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
      // Step 1: Analyze the original website
      const { screenshot: originalScreenshot, domContent, seoRecommendations } = await analyzeWebsite(url);

      // Step 2: Apply SEO recommendations and get new screenshot
      const { screenshot: modifiedScreenshot, modifiedContent } = await applyRecommendations(url, seoRecommendations, domContent);

      res.status(200).json({
        originalScreenshot,
        modifiedScreenshot,
        seoRecommendations,
        modifiedContent
      });
    } catch (error) {
      console.error('Error analyzing website:', error);
      res.status(500).json({ error: 'Failed to analyze website' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function analyzeWebsite(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

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

  return { screenshot, domContent, seoRecommendations };
}

async function applyRecommendations(url: string, recommendations: string, originalContent: any) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  const modifiedContent = await page.evaluate((recommendations, originalContent) => {
    // Apply recommendations (this is a simplified example)
    document.title = recommendations.includes('title') ? 'Improved SEO Title' : document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && recommendations.includes('meta description')) {
      metaDesc.setAttribute('content', 'Improved meta description for better SEO');
    }
    const h1 = document.querySelector('h1');
    if (h1 && recommendations.includes('h1')) {
      h1.textContent = 'Improved H1 Tag for SEO';
    }

    return {
      title: document.title,
      metaDescription: metaDesc ? metaDesc.getAttribute('content') : '',
      h1s: Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent),
      h2s: Array.from(document.querySelectorAll('h2')).map(h2 => h2.textContent),
    };
  }, recommendations, originalContent);

  const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

  await browser.close();

  return { screenshot, modifiedContent };
}
