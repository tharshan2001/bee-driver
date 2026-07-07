const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const http = require('http');

const config = getDefaultConfig(__dirname);

const proxiedConfig = {
  ...config,
  server: {
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        if (__DEV__ && req.url.startsWith('/api')) {
          const options = {
            hostname: 'localhost',
            port: 8085,
            path: req.url,
            method: req.method,
            headers: { ...req.headers },
          };
          delete options.headers['host'];

          const proxy = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          });

          proxy.on('error', (err) => {
            if (__DEV__) console.error('[Proxy] Error:', err.message);
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
          });

          req.pipe(proxy, { end: true });
        } else {
          middleware(req, res, next);
        }
      };
    },
  },
};

module.exports = withUniwindConfig(proxiedConfig, {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
