import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Audit {
  id: string;
  score: number;
  title: string;
  displayValue?: string;
}

interface LighthouseScoreProps {
  score: number;
  category: string;
  title: string;
  description: string;
  audits: Audit[];
}

interface LighthouseResult {
  category: string;
  score: number;
  title: string;
  description: string;
  auditRefs: { id: string }[];
}

const LighthouseScore: React.FC<LighthouseScoreProps> = ({
  score,
  category,
  title,
  description,
  audits,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getColor = (score: number): string => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="mb-6 p-6 border rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <div
          className={`w-20 h-20 rounded-full ${getColor(
            score
          )} flex items-center justify-center mr-6`}
        >
          <span className="text-white text-2xl font-bold">{score}</span>
        </div>
        <div>
          <h3 className="font-semibold text-xl text-slate-800">{title}</h3>
          <p className="text-base text-slate-600">{category}</p>
        </div>
      </div>
      <p className="text-base mb-4 text-slate-700">{description}</p>
      <button
        className="text-indigo-600 hover:text-indigo-800 font-medium text-base"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Hide Details" : "Show Details"}
      </button>
      {isExpanded && (
        <div className="mt-4">
          <h4 className="font-semibold mb-3 text-lg text-slate-800">Audits:</h4>
          <ul className="list-disc pl-6">
            {audits.map((audit) => (
              <li key={audit.id} className="mb-2 text-base text-slate-700">
                <span
                  className={
                    audit.score === 1 ? "text-emerald-600" : "text-amber-600"
                  }
                >
                  {audit.score === 1 ? "✓" : "✗"}
                </span>{" "}
                {audit.title}
                {audit.displayValue && ` - ${audit.displayValue}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
const SEOAnalyzer: React.FC = () => {
  const [url, setUrl] = useState<string>("");
  const [screenshot, setScreenshot] = useState<string>("");
  const [seoAnalysis, setSeoAnalysis] = useState<string>("");
  const [lighthouseResults, setLighthouseResults] = useState<LighthouseResult[]>([]);
  const [lighthouseAudits, setLighthouseAudits] = useState<Audit[]>([]);
  const [openAIFeedback, setOpenAIFeedback] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const screenshotRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initDB = async () => {
    if (!isInitialized) {
      try {
        setIsInitialized(true);
        await Promise.all([
          axios.post<{}>("/api/init", {})
        ]);
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    }
  };

  useEffect(() => {
    initDB();
  }, []);


  // const initDB = async () => {
  //   try {
  //     await Promise.all([
  //       axios.post<{}>("/api/init", {})
  //     ]);
  //   } catch (error) {
  //     console.error("Error analyzing website:", error);
  //   }
  // }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [analysisResponse, lighthouseResponse] = await Promise.all([
        axios.post<{ screenshot: string; seoAnalysis: string }>("/api/analyze", { url }),
        axios.post<{ lighthouseResults: LighthouseResult[]; lighthouseAudits: Audit[]; feedback: string }>("/api/lighthouse", { url }),
      ]);

      setScreenshot(analysisResponse.data.screenshot);
      setSeoAnalysis(analysisResponse.data.seoAnalysis);
      setLighthouseResults(lighthouseResponse.data.lighthouseResults);
      setLighthouseAudits(lighthouseResponse.data.lighthouseAudits);
      setOpenAIFeedback(lighthouseResponse.data.feedback);
    } catch (error) {
      console.error("Error analyzing website:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-6 py-8 bg-gradient-to-br">
      <h1 className="text-5xl font-bold mb-8 text-indigo-700 text-center">
        BÓBR AUDIT
      </h1>
      <div className="flex justify-center mb-8">
        <img src="/bobr.png" alt="Bobr" className="w-80 h-80" />
      </div>

      <form onSubmit={handleSubmit} 
      // onLoad={initDB} 
      className="mb-8 max-w-xl mx-auto">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          required
          className="w-full p-3 text-slate-800 border rounded-lg bg-white shadow-inner text-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center justify-center text-lg"
        >
          {loading ? (
            <>
              <img src="/loading.svg" className="h-8 mr-3" alt="Loading" />
              <span>Analyzing...</span>
            </>
          ) : (
            "Analyze Website"
          )}
        </button>
      </form>

      <div className="flex flex-col md:flex-row mb-8 space-y-6 md:space-y-0 md:space-x-6">
        {screenshot && (
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">
              Website Preview
            </h2>
            <div
              ref={screenshotRef}
              className="h-[600px] overflow-y-auto border rounded-lg bg-white shadow-md"
            >
              <img
                src={`data:image/png;base64,${screenshot}`}
                alt="Website Screenshot"
                className="w-full"
              />
            </div>
          </div>
        )}

        {seoAnalysis && (
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">
              SEO Improvement Steps
            </h2>
            <div className="bg-white p-6 text-slate-800 rounded-lg shadow-md h-[600px] overflow-y-auto">
              <ReactMarkdown>{seoAnalysis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {lighthouseResults.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-700 text-center">
            Lighthouse Results
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={lighthouseResults}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="category" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip labelClassName="text-black font-bold" />
              <Bar dataKey="score" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
          {lighthouseResults.map((result) => (
            <LighthouseScore
              key={result.category}
              score={result.score}
              category={result.category}
              title={result.title}
              description={result.description}
              audits={lighthouseAudits.filter((audit) =>
                result.auditRefs.some((ref) => ref.id === audit.id)
              )}
            />
          ))}
        </div>
      )}

      {openAIFeedback && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-700 text-center">
            AI-Generated Feedback
          </h2>
          <div className="bg-white p-6 text-slate-800 rounded-lg shadow-md max-h-[600px] overflow-y-auto">
            <ReactMarkdown>{openAIFeedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOAnalyzer;