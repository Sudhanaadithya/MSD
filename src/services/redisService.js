/**
 * Upstash Redis Service — Smart Rental Track
 * ============================================
 * Provides ultra-fast distributed caching for weather forecasts,
 * fleet telemetry, search queries, and dashboard KPIs.
 */

import { Redis } from '@upstash/redis';

const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL || 'https://sweet-manatee-176074.upstash.io';
const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAq_KAAIgcDJiYWI5M2M2NGE2OTY0MjYyYTJiZjZmNGMwOTNkMGQ5Zg';

export const redis = new Redis({
  url,
  token,
});

/**
 * Helper to get cached data or fetch & store if missing (Cache-Aside Pattern)
 * @param {string} key 
 * @param {Function} fetchFn 
 * @param {number} ttlSeconds - Time to live in seconds (default 10 mins)
 */
export async function getOrSetCache(key, fetchFn, ttlSeconds = 600) {
  try {
    const cached = await redis.get(key);
    if (cached !== null && cached !== undefined) {
      console.info(`[Upstash Redis HIT] Key: ${key}`);
      return cached;
    }
  } catch (err) {
    console.warn(`[Upstash Redis GET Warning] ${err.message} — falling back to live fetch.`);
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  try {
    if (freshData !== null && freshData !== undefined) {
      await redis.set(key, freshData, { ex: ttlSeconds });
      console.info(`[Upstash Redis MISS -> SET] Key: ${key} (TTL: ${ttlSeconds}s)`);
    }
  } catch (err) {
    console.warn(`[Upstash Redis SET Warning] ${err.message}`);
  }

  return freshData;
}

/**
 * Set value in Redis with optional expiration
 */
export async function redisSet(key, value, ttlSeconds = null) {
  try {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.warn(`[Upstash Redis SET Error] ${err.message}`);
  }
}

/**
 * Get value from Redis
 */
export async function redisGet(key) {
  try {
    return await redis.get(key);
  } catch (err) {
    console.warn(`[Upstash Redis GET Error] ${err.message}`);
    return null;
  }
}

export default redis;
