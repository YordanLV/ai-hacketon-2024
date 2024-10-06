import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    responseLimit: "50mb",
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { url } = req.body;

    if (typeof url !== "string") {
      res.status(400).json({ error: "Invalid URL provided" });
      return;
    }

    try {
      const { screenshot, seoAnalysis } = await analyzeWebsite(url);

      res.status(200).json({
        screenshot,
        seoAnalysis,
      });
    } catch (error) {
      console.error("Error analyzing website:", error);
      res.status(500).json({ error: "Failed to analyze website" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

interface SEORelevantContent {
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  paragraphs: string[];
  lists: { type: string; items: string[] }[];
  links: { href: string; text: string }[];
  images: { alt: string }[];
}

async function analyzeWebsite(
  url: string
): Promise<{ screenshot: string; seoAnalysis: string }> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  const screenshot = (await page.screenshot({
    encoding: "base64",
    fullPage: true,
  })) as string;

  const seoRelevantContent: SEORelevantContent = await page.evaluate(() => {
    const getInnerText = (selector: string): string[] => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map((el) => el.textContent || "");
    };

    const getMetaContent = (name: string): string => {
      const element = document.querySelector(`meta[name="${name}"]`);
      return element ? element.getAttribute("content") || "" : "";
    };

    const getHeadings = (level: number): string[] => {
      return getInnerText(`h${level}`);
    };

    const getLists = (): { type: string; items: string[] }[] => {
      const lists = Array.from(document.querySelectorAll("ul, ol"));
      return lists.map((list) => ({
        type: list.tagName.toLowerCase(),
        items: Array.from(list.querySelectorAll("li")).map(
          (li) => li.textContent || ""
        ),
      }));
    };

    return {
      title: document.title,
      metaDescription: getMetaContent("description"),
      h1: getHeadings(1),
      h2: getHeadings(2),
      h3: getHeadings(3),
      h4: getHeadings(4),
      h5: getHeadings(5),
      h6: getHeadings(6),
      paragraphs: getInnerText("p"),
      lists: getLists(),
      links: Array.from(document.querySelectorAll("a")).map((a) => ({
        href: a.href,
        text: a.textContent || "",
      })),
      images: Array.from(document.querySelectorAll("img")).map((img) => ({
        alt: img.alt,
      })),
    };
  });

  await browser.close();

  const summarize = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + "...";
  };

  const summarizedContent: SEORelevantContent = {
    ...seoRelevantContent,
    paragraphs: seoRelevantContent.paragraphs.map((p) => summarize(p, 200)),
    lists: seoRelevantContent.lists.map((list) => ({
      ...list,
      items: list.items.map((item) => summarize(item, 100)),
    })),
    links: seoRelevantContent.links.map((link) => ({
      ...link,
      text: summarize(link.text, 50),
    })),
  };

  const prompt = `Analyze the following website content for SEO optimizations:

URL: ${url}

Title: ${summarizedContent.title}
Meta Description: ${summarizedContent.metaDescription}

Headings:
${["h1", "h2", "h3", "h4", "h5", "h6"]
  .map(
    (h) =>
      `${h.toUpperCase()}: ${(
        summarizedContent[h as keyof SEORelevantContent] as string[]
      ).join(" | ")}`
  )
  .join("\n")}

Paragraphs:
${summarizedContent.paragraphs.join("\n\n")}

Lists:
${JSON.stringify(summarizedContent.lists, null, 2)}

Links: ${JSON.stringify(summarizedContent.links, null, 2)}

Images: ${JSON.stringify(summarizedContent.images, null, 2)}

Provide a comprehensive SEO analysis and improvement plan based on this content. Focus on:
1. Meta tags optimization
2. Heading structure and content hierarchy
3. Paragraph content, keyword usage, and readability
4. List structure and content relevance
5. Internal and external linking strategy
6. Image optimization (alt tags, file names)
7. Content organization and user experience
8. Keyword placement, density, and semantic relevance
9. Mobile-friendliness considerations
10. Page load speed implications (based on content structure)

For each area, provide detailed, actionable recommendations and explain their potential impact on SEO. Consider both on-page and technical SEO factors in your analysis.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const seoAnalysis = response.choices[0].message?.content || "";

  return { screenshot, seoAnalysis };
}
