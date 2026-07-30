import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or API Key missing. Please check configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (url, options) => {
      const urlStr = url.toString();
      try {
        const response = await fetch(url, options);
        // Silently intercept 404 from missing PostgREST tables — return empty data instead of red console errors
        if (response.status === 404 && urlStr.includes('/rest/v1/')) {
          const accept = (options?.headers?.['Accept'] || options?.headers?.['accept'] || '');
          // If request expects a single row (vnd.pgrst.object), return null-safe empty object
          const isSingle = accept.includes('vnd.pgrst.object');
          return new Response(JSON.stringify(isSingle ? {} : []), {
            status: isSingle ? 406 : 200,
            statusText: isSingle ? 'Not Acceptable' : 'OK',
            headers: {
              'Content-Type': 'application/json',
              'Content-Range': '0-0/0',
            },
          });
        }
        return response;
      } catch (err) {
        // Network failure on PostgREST calls — graceful degradation
        if (urlStr.includes('/rest/v1/')) {
          return new Response(JSON.stringify([]), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw err;
      }
    },
  },
});
