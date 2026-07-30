/**
 * Kafka Event Streaming Service — Smart Rental Track
 * =================================─────────────────
 * Simulates Apache Kafka event topics with real-time Pub/Sub,
 * event partition routing, and persistent event logs.
 */

// ── Kafka Topics ───────────────────────────────────────────────────
export const KAFKA_TOPICS = {
  RENTAL_CHECKIN: 'rentals.checkin',
  RENTAL_CHECKOUT: 'rentals.checkout',
  ANOMALY_DETECTED: 'anomalies.detected',
  ALERT_RESOLVED: 'alerts.resolved',
  TELEMETRY_STREAM: 'telemetry.stream',
};

// In-memory event log buffer (last 100 events)
const kafkaEventBuffer = [];
const subscribers = new Set();

// Create Browser BroadcastChannel for multi-tab synchronization
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('smart_rental_kafka_stream');
    broadcastChannel.onmessage = (event) => {
      if (event.data) {
        kafkaEventBuffer.unshift(event.data);
        if (kafkaEventBuffer.length > 100) kafkaEventBuffer.pop();
        notifySubscribers(event.data);
      }
    };
  }
} catch (e) {
  console.warn('Kafka BroadcastChannel notice:', e);
}

function notifySubscribers(event) {
  subscribers.forEach((cb) => {
    try {
      cb(event);
    } catch (err) {
      console.error('Kafka subscriber error:', err);
    }
  });
}

/**
 * Publish an event message to a Kafka topic.
 * @param {string} topic - Topic name from KAFKA_TOPICS
 * @param {object} payload - Event payload data
 * @returns {object} The published Kafka message envelope
 */
export function publishKafkaEvent(topic, payload) {
  const eventEnvelope = {
    eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    topic,
    partition: Math.floor(Math.random() * 3), // Partition 0, 1, or 2
    offset: kafkaEventBuffer.length + 1,
    timestamp: new Date().toISOString(),
    payload,
  };

  // Add to local buffer
  kafkaEventBuffer.unshift(eventEnvelope);
  if (kafkaEventBuffer.length > 100) kafkaEventBuffer.pop();

  // Broadcast to other tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventEnvelope);
    } catch (e) {
      // Ignore broadcast errors
    }
  }

  // Notify active subscribers
  notifySubscribers(eventEnvelope);

  console.info(`[Kafka Producer] Event published to topic [${topic}]:`, eventEnvelope);
  return eventEnvelope;
}

/**
 * Subscribe to live Kafka event stream.
 * @param {function} callback - Receives incoming Kafka message envelopes
 * @returns {function} Unsubscribe function
 */
export function subscribeToKafkaTopic(callback) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Get recent Kafka event log history.
 * @returns {Array} Recent Kafka event envelopes
 */
export function getKafkaEventHistory(limit = 20) {
  return kafkaEventBuffer.slice(0, limit);
}

// Initial seed events for Kafka Stream preview
if (kafkaEventBuffer.length === 0) {
  publishKafkaEvent(KAFKA_TOPICS.TELEMETRY_STREAM, {
    equipment_id: 'EX-402',
    site_id: 'S001',
    engine_hours: 1420.5,
    status: 'ACTIVE',
    msg: 'Telemetry sync healthy',
  });
  publishKafkaEvent(KAFKA_TOPICS.ANOMALY_DETECTED, {
    equipment_id: 'CR-110',
    site_id: 'S002',
    risk_level: 'CRITICAL',
    flags: ['overdue_rental'],
    msg: 'Isolation Forest flagged rental event',
  });
}
