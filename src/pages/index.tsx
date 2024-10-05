import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const LighthouseScore = ({ score, category, title }) => {
  const getColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`w-24 h-24 rounded-full ${getColor(score)} flex items-center justify-center mb-2`}>
        <span className="text-white text-2xl font-bold">{score}</span>
      </div>
      <div className="text-center">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">{category}</p>
      </div>
    </div>
  );
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState('');
  const [lighthouseResults, setLighthouseResults] = useState([]);
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
    } catch (error) {
      console.error('Error analyzing website:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Advanced SEO Analysis Tool</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          required
          className="w-full p-2 text-black border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {loading ? 'Analyzing...' : 'Analyze Website'}
        </button>
      </form>

      {lighthouseResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Lighthouse Results:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lighthouseResults.map((result) => (
              <LighthouseScore
                key={result.category}
                score={result.score}
                category={result.category}
                title={result.title}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row mb-4 space-y-4 md:space-y-0 md:space-x-4">
        {screenshot && (
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-semibold mb-2">Website Preview:</h2>
            <div ref={screenshotRef} className="h-[600px] overflow-y-auto border rounded">
              <img src={`data:image/png;base64,${screenshot}`} alt="Website Screenshot" className="w-full" />
            </div>
          </div>
        )}
        
        {seoAnalysis && (
          <div className="w-full md:w-1/2">
            <h2 className="text-xl font-semibold mb-2">SEO Improvement Steps:</h2>
            <div className="bg-gray-100 p-4 text-black rounded h-[600px] overflow-y-auto">
              <ReactMarkdown>{seoAnalysis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}