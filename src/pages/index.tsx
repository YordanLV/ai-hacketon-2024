import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LighthouseScore = ({ score, category, title, description, audits }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getColor = (score) => {
    if (score >= 90) return '#DA8359';
    if (score >= 50) return '#ECDFCC';
    return '#DA8359';
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-[#FCFAEE]">
      <div className="flex items-center mb-2">
        <div className={`w-16 h-16 rounded-full bg-[${getColor(score)}] flex items-center justify-center mr-4`}>
          <span className="text-[#FCFAEE] text-xl font-bold">{score}</span>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-[#A5B68D]">{title}</h3>
          <p className="text-sm text-[#DA8359]">{category}</p>
        </div>
      </div>
      <p className="text-sm mb-2 text-[#A5B68D]">{description}</p>
      <button
        className="text-[#DA8359] hover:text-[#ECDFCC]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide Details' : 'Show Details'}
      </button>
      {isExpanded && (
        <div className="mt-2">
          <h4 className="font-semibold mb-2 text-[#A5B68D]">Audits:</h4>
          <ul className="list-disc pl-5">
            {audits.map((audit) => (
              <li key={audit.id} className="mb-1 text-[#A5B68D]">
                <span className={audit.score === 1 ? 'text-[#A5B68D]' : 'text-[#DA8359]'}>
                  {audit.score === 1 ? '✓' : '✗'}
                </span>
                {' '}
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

const SEOAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState('');
  const [lighthouseResults, setLighthouseResults] = useState([]);
  const [lighthouseAudits, setLighthouseAudits] = useState([]);
  const [loading, setLoading] = useState(false);

  const screenshotRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [analysisResponse, lighthouseResponse] = await Promise.all([
        axios.post('/api/analyze', { url }),
        axios.post('/api/lighthouse', { url })
      ]);

      setScreenshot(analysisResponse.data.screenshot);
      setSeoAnalysis(analysisResponse.data.seoAnalysis);
      setLighthouseResults(lighthouseResponse.data.lighthouseResults);
      setLighthouseAudits(lighthouseResponse.data.lighthouseAudits);
    } catch (error) {
      console.error('Error analyzing website:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 bg-[#FCFAEE]">
      <h1 className="text-4xl font-bold mb-4 text-[#A5B68D] text-center">BÓBR SEO</h1>
      <div className="flex justify-center mb-4">
        <img src="/bobr.png" alt='Bobr' className="w-64 h-64" />
      </div>
      <form onSubmit={handleSubmit} className="mb-4 max-w-xl mx-auto">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          required
          className="w-full p-2 text-[#A5B68D] border rounded bg-[#ECDFCC]"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full px-4 py-2 bg-[#DA8359] text-[#FCFAEE] rounded hover:bg-[#A5B68D]"
        >
          {loading ? 'Analyzing...' : 'Analyze Website'}
        </button>
      </form>

      {lighthouseResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#A5B68D] text-center">Lighthouse Results</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lighthouseResults}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#A5B68D" />
            </BarChart>
          </ResponsiveContainer>
          {lighthouseResults.map((result) => (
            <LighthouseScore
              key={result.category}
              score={result.score}
              category={result.category}
              title={result.title}
              description={result.description}
              audits={lighthouseAudits.filter(audit => 
                result.auditRefs.some(ref => ref.id === audit.id)
              )}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row mb-4 space-y-4 md:space-y-0 md:space-x-4">
        {screenshot && (
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-semibold mb-2 text-[#A5B68D] text-center">Website Preview</h2>
            <div ref={screenshotRef} className="h-[600px] overflow-y-auto border rounded bg-[#ECDFCC]">
              <img src={`data:image/png;base64,${screenshot}`} alt="Website Screenshot" className="w-full" />
            </div>
          </div>
        )}
        
        {seoAnalysis && (
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-semibold mb-2 text-[#A5B68D] text-center">SEO Improvement Steps</h2>
            <div className="bg-[#ECDFCC] p-4 text-[#A5B68D] rounded h-[600px] overflow-y-auto">
              <ReactMarkdown>{seoAnalysis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOAnalyzer;