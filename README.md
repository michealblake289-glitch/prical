# prical

Cloudflare-ready prison sentence and fine calculator.

## Local development

```bash
npm install
npm start
```

## Cloudflare Pages

Use the following build settings in Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `build`
- Node version: `18`

The frontend automatically calls `/api` by default. If you want to point it to a different backend URL, set:

```env
REACT_APP_BACKEND_URL=https://api.example.com
```

## API behavior

The app includes a Cloudflare Pages Function API at `functions/api/[[path]].js` and does not require FastAPI or MongoDB.
