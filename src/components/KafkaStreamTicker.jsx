import React, { useState, useEffect } from 'react';
import { subscribeToKafkaTopic, getKafkaEventHistory } from '../services/kafkaService';

const KafkaStreamTicker = () => {
  const [events, setEvents] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setEvents(getKafkaEventHistory(10));

    const unsubscribe = subscribeToKafkaTopic((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, 9)]);
    });

    return () => unsubscribe();
  }, []);

  const getTopicBadge = (topic) => {
    switch (topic) {
      case 'rentals.checkin': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'rentals.checkout': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'anomalies.detected': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'alerts.resolved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const latestEvent = events[0];

  return (
    <div className="w-full bg-gray-950 text-white rounded-xl border border-gray-800 shadow-md overflow-hidden transition-all">
      {/* Top Banner Ticker */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 text-xs">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#FFCD00] animate-ping" />
            <span className="font-bold text-[#FFCD00] tracking-wider uppercase text-[10px]">
              KAFKA EVENT STREAM
            </span>
          </div>
          <span className="text-gray-600">|</span>

          {latestEvent ? (
            <div className="flex items-center gap-2 truncate">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getTopicBadge(latestEvent.topic)}`}>
                {latestEvent.topic}
              </span>
              <span className="font-mono text-gray-300 truncate text-[11px]">
                {latestEvent.payload?.equipment_id || latestEvent.payload?.id || 'EVENT'} — {latestEvent.payload?.msg || latestEvent.payload?.status || 'Stream active'}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                P:{latestEvent.partition} O:{latestEvent.offset}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 italic text-[11px]">Listening to Kafka event broker...</span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
        >
          <span>{isExpanded ? 'Collapse' : 'Event Log'}</span>
          <span className="material-symbols-outlined text-sm">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Expanded Kafka Log Table */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto p-3 space-y-1.5 bg-black/60 font-mono text-[11px] divide-y divide-gray-800/50">
          {events.map((evt) => (
            <div key={evt.eventId} className="pt-1.5 flex items-center justify-between gap-2 text-gray-300">
              <div className="flex items-center gap-2 truncate">
                <span className="text-gray-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${getTopicBadge(evt.topic)}`}>
                  {evt.topic}
                </span>
                <span className="text-white font-bold">{evt.payload?.equipment_id || evt.payload?.id || 'SYS'}</span>
                <span className="text-gray-400 truncate">{JSON.stringify(evt.payload)}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-gray-500">
                <span>P{evt.partition}</span>
                <span>#{evt.offset}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KafkaStreamTicker;
