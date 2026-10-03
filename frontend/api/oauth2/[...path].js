/* eslint-env node */
import { Readable } from 'node:stream';

const BACKEND_ENV_KEY = 'BACKEND_ORIGIN';
const HOP_BY_HOP_HEADERS = new Set(['connection', 'transfer-encoding']);

export default async function handler(req, res) {
  const backendOrigin = process.env[BACKEND_ENV_KEY];
  if (!backendOrigin) {
    res.statusCode = 500;
    res.end('Missing BACKEND_ORIGIN');
    return;
  }

  const host = req.headers.host || 'localhost';
  const incomingUrl = new URL(req.url, `http://${host}`);
  const rewrittenPath = incomingUrl.pathname.replace(/^\/api\/oauth2/, '/oauth2');
  const targetUrl = `${backendOrigin.replace(/\/$/, '')}${rewrittenPath}${incomingUrl.search}`;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];
  if (process.env.EDGE_SHARED_SECRET) {
    headers['x-edge-key'] = process.env.EDGE_SHARED_SECRET;
  }

  const method = req.method || 'GET';
  const withoutBody = method === 'GET' || method === 'HEAD';

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: withoutBody ? undefined : req,
      duplex: withoutBody ? undefined : 'half',
      redirect: 'manual'
    });

    res.statusCode = upstream.status;

    const headerMap = new Map();
    upstream.headers.forEach((value, key) => {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
      if (key.toLowerCase() === 'set-cookie') {
        const existing = headerMap.get('set-cookie') || [];
        headerMap.set('set-cookie', existing.concat(value));
        return;
      }
      res.setHeader(key, value);
    });
    if (headerMap.has('set-cookie')) {
      res.setHeader('set-cookie', headerMap.get('set-cookie'));
    }

    if (upstream.headers.has('location')) {
      // ensure absolute redirect URLs continue to the backend origin if relative
      const location = upstream.headers.get('location');
      if (location && location.startsWith('/')) {
        res.setHeader('location', `${backendOrigin.replace(/\/$/, '')}${location}`);
      }
    }

    if (upstream.body && res.statusCode !== 304) {
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
