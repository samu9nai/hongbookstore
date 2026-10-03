/* eslint-env node */
// Vercel Serverless Function: Proxy /api/* to backend origin
// Requirements (set in Vercel Project → Settings → Environment Variables):
// - BACKEND_ORIGIN: e.g., http://<GCE_IP>:8080
// - EDGE_SHARED_SECRET (optional): shared secret to send as x-edge-key

import { Readable } from 'node:stream';

export default async function handler(req, res) {
  const backendOrigin = process.env.BACKEND_ORIGIN;
  if (!backendOrigin) {
    res.statusCode = 500;
    res.end('Missing BACKEND_ORIGIN');
    return;
  }

  // Compose target URL. req.url already includes the '/api/...' path and query.
  const targetUrl = backendOrigin.replace(/\/$/, '') + req.url;

  // Copy headers; strip hop-by-hop headers; add shared secret if provided.
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];
  delete headers['if-none-match'];
  delete headers['if-modified-since'];
  if (process.env.EDGE_SHARED_SECRET) {
    headers['x-edge-key'] = process.env.EDGE_SHARED_SECRET;
  }

  const method = req.method || 'GET';
  const isBodyless = method === 'GET' || method === 'HEAD';

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: isBodyless ? undefined : req,
      // Required when passing a Node stream in fetch body
      // (Node 18+ global fetch / undici)
      duplex: isBodyless ? undefined : 'half',
      redirect: 'follow',
    });

    // Set status and headers
    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      // Avoid setting hop-by-hop headers on the response
      if (['connection', 'transfer-encoding'].includes(key.toLowerCase())) return;
      if (key.toLowerCase() === 'etag') return; // avoid client conditional revalidation causing empty bodies
      res.setHeader(key, value);
    });

    // Prevent CDN/browser caching so stale ETags don't trigger 304 with empty body
    res.setHeader('cache-control', 'no-store');

    // Stream body to client
    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (_err) {
    res.statusCode = 502;
    res.end('Bad gateway');
  }
}
