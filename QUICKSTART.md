# Quick Start Guide

## Try It Now (Locally)

Your application is **already running** and ready to test!

### Current Status

**Backend**: Running at http://localhost:8000
**Frontend**: Running at http://localhost:3010

### Test the Application

1. **Open your browser**
   ```
   http://localhost:3010
   ```

2. **Upload a sample SOW**
   - Use the sample file: `sample_nyserda_sow.txt`
   - Or drag & drop any PDF/DOCX/TXT SOW document
   - Max file size: 10MB

3. **Wait for analysis**
   - Analysis takes 30-60 seconds
   - You'll see a loading spinner
   - Results will display automatically

4. **Review the results**
   - Summary cards show issue counts
   - Weak KPIs section shows problematic metrics
   - Scope creep warnings highlight risky language
   - Download results as JSON

### Expected Results (Sample SOW)

When you upload `sample_nyserda_sow.txt`, you should see:

- **Total Issues**: ~14 findings
- **High Severity**: 3-4 issues
- **Medium Severity**: 6-8 issues
- **Low Severity**: 3-5 issues

#### Sample Weak KPIs Found:
- "Reduce processing time to target levels" → Missing specific target
- "Achieve system availability during business hours" → No uptime percentage
- "Improve citizen satisfaction" → No baseline or target

#### Sample Scope Creep:
- "ongoing support as needed"
- "reasonable assistance to agency staff"

### Test the API Directly

```bash
# Health check
curl http://localhost:8000/

# Analyze a file
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@sample_nyserda_sow.txt"
```

## Deploy to Production

Once you're happy with local testing:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SOW Analyzer"
   git remote add origin https://github.com/YOUR_USERNAME/sow-analyzer.git
   git push -u origin main
   ```

2. **Deploy Backend to Railway**
   - Visit https://railway.app/new
   - Connect your GitHub repo
   - Add `ANTHROPIC_API_KEY` environment variable
   - Deploy → Copy backend URL

3. **Deploy Frontend to Vercel**
   - Visit https://vercel.com/new
   - Connect your GitHub repo
   - Set root directory to `frontend`
   - Add `NEXT_PUBLIC_API_URL` = your Railway URL
   - Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Troubleshooting

### Backend won't start
```bash
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend won't start
```bash
cd frontend
npm install
npm run dev
```

### "Analysis failed" error
- Check that backend is running (http://localhost:8000/)
- Verify ANTHROPIC_API_KEY is set in `.env`
- Check that API key has credits remaining

### CORS errors
- Ensure backend is running on port 8000
- Frontend automatically points to http://localhost:8000 in dev mode

## Next Steps

1. Test locally with sample SOW
2. Verify all features work
3. Deploy to Railway and Vercel
4. Share your deployed URL!

---

**Need help?** Check the main [README.md](README.md) or [DEPLOYMENT.md](DEPLOYMENT.md)
