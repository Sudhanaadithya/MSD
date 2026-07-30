import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or API Key missing. Please check configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (url, options) => {
      try {
        const response = await fetch(url, options);
        // Intercept 404 table missing responses from Supabase PostgREST and return synthetic 200 OK
        if (response.status === 404 && url.toString().includes('/rest/v1/')) {
          return new Response(JSON.stringify([]), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              'Content-Range': '0-0/0',
            },
          });
        }
        return response;
      } catch (err) {
        if (url.toString().includes('/rest/v1/')) {
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
