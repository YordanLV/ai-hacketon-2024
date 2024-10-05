import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch data from DataForSEO API
      const response = await fetch('https://api.dataforseo.com/v3/backlinks/backlinks/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          target: "https://team-gpt.com/",
          limit: 100,
          internal_list_limit: 10,
          backlinks_status_type: "live",
          include_subdomains: true,
          exclude_internal_backlinks: true,
          include_indirect_links: true,
          mode: "one_per_domain"
        }])
      });

      console.log(response)

      res.status(200).json({ test: 'ok' });
    } catch (error) {
      console.error('Error fetching backlinks:', error);
      res.status(500).json({ error: 'Failed to fetch backlinks', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}