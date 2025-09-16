import { useEffect, useState } from "react";

interface WebhookEvent {
  method: string;
  receivedAt: string;
  body: Record<string, unknown>;
  id?: string;
}

export default function Channel() {
  // Extract channel from URL manually
  const getChannelFromUrl = () => {
    const path = window.location.pathname;
    const segments = path.split('/');
    const channelIndex = segments.findIndex(segment => segment === 'channel');
    return channelIndex !== -1 && channelIndex < segments.length - 1 
      ? segments[channelIndex + 1] 
      : null;
  };

  const [channel, setChannel] = useState<string | null>(getChannelFromUrl());
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      setChannel(getChannelFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    console.log("Current URL:", window.location.pathname);
    console.log("Extracted channel:", channel);
    
    if (!channel) {
      setError("Channel ID is missing from URL");
      setLoading(false);
      return;
    }

    // Function to fetch history
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const url = `http://localhost:5000/api/history/${channel}`;
        console.log("Fetching from URL:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: WebhookEvent[] = await response.json();
        setEvents(data.reverse());
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to load history: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Open SSE stream
    const sseUrl = `http://localhost:5000/api/events/${channel}`;
    console.log("Opening SSE connection to:", sseUrl);
    
    const evtSource = new EventSource(sseUrl);
    
    evtSource.onopen = () => {
      console.log("SSE connection opened");
      setConnectionStatus("connected");
      setError(null);
    };
    
    evtSource.onmessage = (e: MessageEvent) => {
      try {
        const webhook: WebhookEvent = JSON.parse(e.data);
        setEvents(prev => [webhook, ...prev]);
        setError(null);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setError("Failed to parse incoming event");
      }
    };

    evtSource.onerror = (err) => {
      console.error("SSE error:", err);
      setConnectionStatus("error");
      setError("Event stream connection error. Check if server is running.");
    };

    return () => {
      evtSource.close();
      setConnectionStatus("disconnected");
    };
  }, [channel]);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEvents(newExpanded);
  };

  const filteredEvents = filterMethod === "ALL" 
    ? events 
    : events.filter(e => e.method === filterMethod);

  const methodCounts = events.reduce((acc, e) => {
    acc[e.method] = (acc[e.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const testConnection = async () => {
    if (!channel) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/history/${channel}`);
      if (response.ok) {
        const data = await response.json();
        setError(null);
        alert(`Connection successful! Received ${data.length} events`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      setError(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
      alert(`Connection test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Show debug info if channel is undefined
  if (!channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Channel Not Found</h1>
          <p className="text-gray-600 mb-2">Current URL: {window.location.pathname}</p>
          <p className="text-red-600 mb-4">No channel parameter found in URL</p>
          <div className="mt-4 text-sm text-gray-500">
            <p className="mb-2">Expected URL format: <code>/channel/your-channel-name</code></p>
            <p>Example: <a href="/channel/test123" className="text-blue-600 underline">/channel/test123</a></p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading channel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-2 rounded-lg">#</span>
            Channel: {channel}
          </h1>
          <p className="text-gray-600 mt-2">Real-time webhook events monitoring</p>
          
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connectionStatus === "connected" ? "bg-green-100 text-green-800" : 
              connectionStatus === "connecting" ? "bg-yellow-100 text-yellow-800" : 
              "bg-red-100 text-red-800"
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500 animate-pulse" : 
                connectionStatus === "connecting" ? "bg-yellow-500" : 
                "bg-red-500"
              }`}></div>
              <span className="text-sm">
                {connectionStatus === "connected" ? "Live connected" : 
                 connectionStatus === "connecting" ? "Connecting..." : 
                 "Connection failed"}
              </span>
            </div>
            
            <button 
              onClick={testConnection}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Test Connection
            </button>
            
            {error && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-md">
                <span>⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Filter by method:</span>
              <select 
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Methods ({events.length})</option>
                {Object.entries(methodCounts).map(([method, count]) => (
                  <option key={method} value={method}>
                    {method} ({count})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setEvents([])}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                Clear Events
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-5xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-600">No events yet</h3>
                <p className="text-gray-500">Webhook events will appear here when received</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredEvents.map((e, i) => (
                  <li key={i} className="p-4 hover:bg-gray-50 transition-colors">
                    <div 
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => toggleExpand(i)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-3 h-3 rounded-full ${
                          i === 0 ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            e.method === 'GET' ? 'bg-green-100 text-green-800' :
                            e.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            e.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            e.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {e.method}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(e.receivedAt).toLocaleDateString()} at {new Date(e.receivedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        {expandedEvents.has(i) ? '▲' : '▼'}
                      </button>
                    </div>
                    
                    {expandedEvents.has(i) && (
                      <div className="mt-3 pl-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payload</h4>
                          <pre className="text-xs overflow-x-auto bg-gray-100 p-3 rounded-md">
                            {JSON.stringify(e.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500">
          <p>Monitoring webhook events in real-time. Keep this window open to receive updates.</p>
        </footer>
      </div>
    </div>
  );
}
