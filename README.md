# SmartStudy — Deploy to Netlify in 5 Minutes

## Project Structure
```
smartstudy/
├── netlify/
│   └── functions/
│       └── claude.js      ← Secure API proxy (your key stays here)
├── public/
│   ├── index.html
│   └── _redirects
├── src/
│   ├── index.js
│   └── App.js             ← Full React app (6 pages)
├── netlify.toml           ← Netlify config
└── package.json
```

## Deploy Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "SmartStudy app"
git remote add origin https://github.com/YOUR_USERNAME/smartstudy.git
git push -u origin main
```

### 2. Connect to Netlify
- Go to netlify.com → "Add new site" → "Import from Git"
- Select your GitHub repo
- Build command: `npm run build`
- Publish directory: `build`
- Click Deploy

### 3. Add Your API Key (SECRET — never in code)
- Go to: Site Settings → Environment Variables → Add variable
- Key: `ANTHROPIC_API_KEY`
- Value: `sk-ant-your-key-here`
- Click Save → Trigger redeploy

That's it! Your app is live with AI fully working and your key secure.

## How the AI Security Works
- Browser → calls `/.netlify/functions/claude` (YOUR server)
- Netlify Function → adds API key → calls Anthropic
- API key NEVER reaches the browser
