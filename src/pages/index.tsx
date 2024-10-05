import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  const [originalScreenshot, setOriginalScreenshot] = useState('');
  const [modifiedScreenshot, setModifiedScreenshot] = useState('');
  const [seoRecommendations, setSeoRecommendations] = useState('');
  const [modifiedContent, setModifiedContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/analyze', { url });
      setOriginalScreenshot(response.data.originalScreenshot);
      setModifiedScreenshot(response.data.modifiedScreenshot);
      setSeoRecommendations(response.data.seoRecommendations);
      setModifiedContent(response.data.modifiedContent);
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
      {originalScreenshot && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Original Screenshot:</h2>
          <img src={`data:image/png;base64,${originalScreenshot}`} alt="Original Website Screenshot" className="w-full" />
        </div>
      )}
      {seoRecommendations && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">SEO Recommendations:</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 text-black rounded">{seoRecommendations}</pre>
        </div>
      )}
      {modifiedScreenshot && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Modified Screenshot:</h2>
          <img src={`data:image/png;base64,${modifiedScreenshot}`} alt="Modified Website Screenshot" className="w-full" />
        </div>
      )}
      {modifiedContent && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Modified Content:</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 text-black p-4 rounded">{JSON.stringify(modifiedContent, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}