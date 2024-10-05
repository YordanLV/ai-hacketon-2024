import { NextApiRequest, NextApiResponse } from 'next';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url } = req.body;

    try {
      const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
      };

      const runnerResult = await lighthouse(url, options);
      await chrome.kill();

      const reportCategories = JSON.parse(runnerResult.report).categories;
      const lighthouseResults = Object.keys(reportCategories).map(key => ({
        category: key,
        score: Math.round(reportCategories[key].score * 100),
        title: reportCategories[key].title
      }));

      res.status(200).json({ lighthouseResults });
    } catch (error) {
      console.error('Error running Lighthouse:', error);
      res.status(500).json({ error: 'Failed to run Lighthouse analysis' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}