import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [url, setUrl] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const screenshotRef = useRef(null);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/analyze', { url });
      setScreenshot(response.data.screenshot);
      setSeoAnalysis(response.data.seoAnalysis);
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