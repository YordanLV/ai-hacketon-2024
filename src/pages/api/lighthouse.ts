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

      const report = JSON.parse(runnerResult.report);
      const { categories, audits } = report;

      const lighthouseResults = Object.keys(categories).map(key => ({
        category: key,
        score: Math.round(categories[key].score * 100),
        title: categories[key].title,
        description: categories[key].description,
        manualDescription: categories[key].manualDescription,
        auditRefs: categories[key].auditRefs.map((ref: { id: any; weight: any; group: any; }) => ({
          id: ref.id,
          weight: ref.weight,
          group: ref.group
        }))
      }));

      const lighthouseAudits = Object.keys(audits).map(key => ({
        id: key,
        title: audits[key].title,
        description: audits[key].description,
        score: audits[key].score,
        scoreDisplayMode: audits[key].scoreDisplayMode,
        displayValue: audits[key].displayValue,
        numericValue: audits[key].numericValue,
        numericUnit: audits[key].numericUnit,
        details: audits[key].details
      }));

      res.status(200).json({ lighthouseResults, lighthouseAudits });
    } catch (error) {
      console.error('Error running Lighthouse:', error);
      res.status(500).json({ error: 'Failed to run Lighthouse analysis' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}