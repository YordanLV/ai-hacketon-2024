import { NextApiRequest, NextApiResponse } from "next";
import lighthouse, { Flags } from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LighthouseCategory {
  score: number;
  title: string;
  description: string;
  manualDescription?: string;
  auditRefs: {
    id: string;
    weight: number;
    group?: string;
  }[];
}

interface LighthouseAudit {
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  details?: unknown;
}

interface LighthouseResult {
  category: string;
  score: number;
  title: string;
  description: string;
  manualDescription?: string;
  auditRefs: {
    id: string;
    weight: number;
    group?: string;
  }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { url } = req.body as { url: string };

    try {
      const chrome = await chromeLauncher.launch({
        chromeFlags: ["--headless"],
      });
      const options = {
        logLevel: "info",
        output: "json",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        port: chrome.port,
      } as Flags | undefined;

      const runnerResult = await lighthouse(url, options);
      chrome.kill();

      const report = JSON.parse(runnerResult?.report as string);
      const { categories, audits } = report;

      const lighthouseResults: LighthouseResult[] = Object.entries(
        categories
      ).map(([key, value]) => ({
        category: key,
        score: Math.round((value as LighthouseCategory).score * 100),
        title: (value as LighthouseCategory).title,
        description: (value as LighthouseCategory).description,
        manualDescription: (value as LighthouseCategory).manualDescription,
        auditRefs: (value as LighthouseCategory).auditRefs.map((ref) => ({
          id: ref.id,
          weight: ref.weight,
          group: ref.group,
        })),
      }));

      const lighthouseAudits: LighthouseAudit[] = Object.entries(audits).map(
        ([key, value]) => ({
          id: key,
          title: (value as LighthouseAudit).title,
          description: (value as LighthouseAudit).description,
          score: (value as LighthouseAudit).score,
          scoreDisplayMode: (value as LighthouseAudit).scoreDisplayMode,
          displayValue: (value as LighthouseAudit).displayValue,
          numericValue: (value as LighthouseAudit).numericValue,
          numericUnit: (value as LighthouseAudit).numericUnit,
          details: (value as LighthouseAudit).details,
        })
      );

      // Generate feedback using OpenAI
      const feedback = await generateFeedback(
        lighthouseResults,
        lighthouseAudits
      );

      res.status(200).json({ lighthouseResults, lighthouseAudits, feedback });
    } catch (error) {
      console.error("Error running Lighthouse and generating feedback:", error);
      res
        .status(500)
        .json({
          error: "Failed to run Lighthouse analysis and generate feedback",
        });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function generateFeedback(
  results: LighthouseResult[],
  audits: LighthouseAudit[]
): Promise<string> {
  // Filter audits to only include those with a score different than 0
  const filteredAudits = audits.filter(
    (audit) => audit.score !== 0 && audit.score !== null
  );

  const prompt = `Analyze the following Lighthouse results for a website and provide detailed, actionable feedback on how to improve the most critical issues:

Audits:
${JSON.stringify(filteredAudits.slice(0, 5), null, 2)}

For each of the top 3-5 most critical issues:

1. Present the issue in the following format:

Problem: 
[Clearly state the issue and its impact on the website's performance, accessibility, best practices, or SEO]

Solution:
- [Provide specific, actionable steps to resolve the issue]
- [Include any quick wins or easy fixes that could significantly improve the score]
- [Explain why each step is important and how it contributes to solving the problem]

2. Prioritize the most impactful recommendations that will have the greatest effect on improving the site's overall performance and user experience.

3. Ensure that the solutions are practical and implementable, providing enough detail for a web developer or site owner to follow and improve their site.

Limit your response to about 1000 words, focusing on the most critical issues and their solutions.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0].message?.content || "";
}
