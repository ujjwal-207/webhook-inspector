import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Channel() {
  const { channel } = useParams();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // fetch history
    fetch(`http://localhost:5000/history/${channel}`)
      .then(res => res.json())
      .then(data => setEvents(data.reverse()));

    // open SSE stream
    const evtSource = new EventSource(`http://localhost:5000/events/${channel}`);
    evtSource.onmessage = e => {
      const webhook = JSON.parse(e.data);
      setEvents(prev => [...prev, webhook]);
    };
    return () => evtSource.close();
  }, [channel]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Channel {channel}</h1>
      <ul className="mt-4 space-y-2">
        {events.map((e, i) => (
          <li key={i} className="p-2 bg-gray-100 rounded">
            <p><b>{e.method}</b> at {new Date(e.receivedAt).toLocaleTimeString()}</p>
            <pre className="text-xs overflow-x-auto">{JSON.stringify(e.body, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
 
