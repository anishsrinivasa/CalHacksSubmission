# Tech Stack & Architecture

## Overview
Procurement SOW & KPI Analyzer - AI-powered tool to detect waste, weak KPIs, and overlaps in government contracts.

---

## Current Tech Stack

### Backend (Python)
```
Language:     Python 3.12
AI Model:     Claude 3 Haiku (Anthropic API)
              - Cost: ~$0.25/million input tokens, ~$1.25/million output
              - ~$0.02-0.05 per SOW analysis
Doc Parsing:  PyMuPDF (PDF), python-docx (DOCX)
Config:       python-dotenv
```

**Core Files:**
- `sow_extractor.py` - Pass 1: Extract structured data from SOWs
- `risk_analyzer.py` - Pass 2: Analyze individual SOWs for risks
- `kpi_enhancer.py` - Pass 3: Generate SMART KPI alternatives (TODO)
- `overlap_detector.py` - Pass 4: Cross-contract overlap detection (TODO)

### Frontend (Next.js)
```
Framework:    Next.js 14+ (React)
Styling:      Tailwind CSS
Location:     /hackbronx/ (your existing app)
API:          Will call Python backend via REST
```

**Planned Pages:**
- `/upload` - Upload SOW files (PDF/DOCX)
- `/results` - Display analysis findings
- `/compare` - Compare multiple contracts for overlaps

---

## Deployment Architecture

### Option 1: Split Deployment (RECOMMENDED for MVP)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  User Browser                                   │
│                                                 │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Next.js (Vercel)                     │
│  - File upload interface                        │
│  - Results dashboard                            │
│  - Overlap matrix visualization                 │
└──────────────┬──────────────────────────────────┘
               │
               │ HTTP API calls
               ▼
┌─────────────────────────────────────────────────┐
│  Backend: Python FastAPI (Railway/Render)       │
│  - /api/extract                                 │
│  - /api/analyze                                 │
│  - /api/enhance                                 │
│  - /api/compare                                 │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  Anthropic Claude API                           │
│  - Claude 3 Haiku model                         │
└─────────────────────────────────────────────────┘
```

**Hosting:**
- **Frontend:** Vercel (free tier)
  - Automatic deployment from Git
  - Edge functions
  - Custom domain support

- **Backend:** Railway.app or Render.com (free tier)
  - Docker deployment
  - 500 hours/month free
  - Persistent storage for uploaded files

**Why split?**
- Python backend needs longer timeouts (AI calls take 30-90 seconds)
- Vercel serverless functions have 10-second timeout (too short)
- Railway/Render free tier is perfect for MVP

---

### Option 2: Vercel All-in-One (Simpler but limited)

```
┌─────────────────────────────────────────────────┐
│  Vercel (Single Deploy)                         │
│                                                 │
│  ├─ Next.js Frontend (pages/)                   │
│  └─ Python Backend (api/)                       │
│     - Vercel Serverless Functions               │
│     - 10 second timeout (WARNING)               │
└──────────────┬──────────────────────────────────┘
               │
               ▼
          Claude API
```

**Pros:**
- Single deployment
- Simpler setup

**Cons:**
- 10-second timeout may not be enough for large SOWs
- Limited file upload size
- May need to optimize AI calls

---

## Website Flow

### User Journey

```
1. UPLOAD
   ├─ User uploads 1-5 SOW files (PDF/DOCX)
   ├─ Frontend validates files (<10MB each)
   └─ Sends to backend /api/extract

2. PROCESSING (Progress indicator)
   ├─ Backend runs Pass 1 (Extraction) on each file
   ├─ Backend runs Pass 2 (Analysis) on each file
   ├─ Backend runs Pass 3 (KPI Enhancement) if requested
   └─ Backend runs Pass 4 (Cross-comparison) if multiple files

3. RESULTS DASHBOARD
   ├─ Summary cards (# of issues by severity)
   ├─ Weak KPIs table with suggestions
   ├─ Scope creep warnings
   ├─ Missing elements checklist
   └─ Download PDF report button

4. OVERLAP VIEW (if multiple files)
   ├─ Overlap matrix heatmap
   ├─ Duplicate deliverables list
   ├─ Financial impact estimates
   └─ Recommendations for consolidation
```

### Example UI Mockup

```
╔═══════════════════════════════════════════════════════════╗
║  Procurement SOW Analyzer                                 ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Upload SOW Documents                                     ║
║  ┌─────────────────────────────────────────────────┐     ║
║  │  Drag & drop PDF or DOCX files here             │     ║
║  │  or click to browse                              │     ║
║  └─────────────────────────────────────────────────┘     ║
║                                                           ║
║  Uploaded Files:                                          ║
║  ├─ Contract_ABC-2024-001.pdf (2.3 MB)                   ║
║  ├─ Contract_ABC-2024-002.pdf (1.8 MB)                   ║
║  └─ Contract_ABC-2024-003.docx (890 KB)                  ║
║                                                           ║
║  [Analyze Contracts] →                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

After analysis:

╔═══════════════════════════════════════════════════════════╗
║  Analysis Results                                         ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Contract: ABC-2024-001 ($5M, 24 months)                  ║
║                                                           ║
║  14 Issues Found                                          ║
║  ├─ 1 High      ├─ 10 Medium    ├─ 3 Low                 ║
║                                                           ║
║  ━━━ Weak KPIs (2) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  • "System Uptime: during business hours"                 ║
║    Missing: baseline, target, timeframe, method           ║
║    Suggestion: "Achieve 99.5% uptime during business      ║
║       hours (8am-6pm ET), measured via monitoring..."     ║
║                                                           ║
║  ━━━ Scope Creep (2) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  • Task 2: "ongoing support as needed"                    ║
║    Risk: Unbounded billing, potential $500K+ overrun      ║
║                                                           ║
║  [View Full Report] [Download PDF] [Compare Contracts]    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## File Structure

```
/calhacks/
├── backend/                    # Python backend
│   ├── sow_extractor.py       # Pass 1
│   ├── risk_analyzer.py       # Pass 2
│   ├── kpi_enhancer.py        # Pass 3 (TODO)
│   ├── overlap_detector.py    # Pass 4 (TODO)
│   ├── requirements.txt
│   ├── .env                   # API keys
│   └── README.md
│
├── hackbronx/                 # Next.js frontend
│   ├── app/
│   │   ├── page.tsx          # Home
│   │   ├── upload/           # Upload page (TODO)
│   │   ├── results/          # Results page (TODO)
│   │   └── api/              # API routes (proxy to Python)
│   ├── components/
│   │   ├── FileUpload.tsx    # (TODO)
│   │   ├── ResultsCard.tsx   # (TODO)
│   │   └── OverlapMatrix.tsx # (TODO)
│   └── package.json
│
└── TECH_STACK.md             # This file
```

---

## Next Steps

### Phase 1: Complete Backend (This Week)
- Pass 1: Extraction
- Pass 2: Risk Analysis
- Pass 3: KPI Enhancement
- Pass 4: Overlap Detection
- FastAPI wrapper for web endpoints

### Phase 2: Build Frontend (Next Week)
- File upload component
- Results dashboard
- Overlap visualization
- PDF report generation

### Phase 3: Deploy (After Testing)
- Deploy backend to Railway
- Deploy frontend to Vercel
- Connect with environment variables
- Test end-to-end

---

## Cost Estimate

**Development:** Free (using free tiers)

**Running Costs (after launch):**
- Vercel: $0 (free tier, 100GB bandwidth)
- Railway: $0 (free tier, 500 hrs/month)
- Claude API: ~$5-10/month for 100-200 SOW analyses
- **Total: ~$5-10/month**

**Scaling:**
- 1,000 SOW analyses/month: ~$50-75/month
- 10,000 SOW analyses/month: ~$500/month

---

## Questions?

1. **"How fast is analysis?"**
   - Single SOW: 1-2 minutes
   - 3 SOWs with comparison: 4-6 minutes

2. **"Can users download results?"**
   - Yes! PDF report generation planned

3. **"Does it store files?"**
   - Temporarily (for analysis session)
   - Auto-delete after 24 hours

4. **"Mobile support?"**
   - Tailwind CSS = responsive by default
   - Upload works on mobile browsers
