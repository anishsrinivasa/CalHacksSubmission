# 🔍 SOW Analyzer

AI-powered analysis tool for government contract Statements of Work (SOWs). Detects waste, weak KPIs, scope creep, and missing critical elements.

![Status](https://img.shields.io/badge/status-ready%20to%20deploy-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Problem Statement

Government agencies waste billions annually on:
- **Duplicate contracts**: Multiple agencies buying the same services without coordination
- **Weak KPIs**: Vague metrics like "improve satisfaction" without measurable targets
- **Scope creep**: Open-ended language leading to budget overruns
- **Missing elements**: Lack of acceptance criteria, assumptions, or success metrics

## 💡 Solution

An AI-powered web application that analyzes SOW documents to:
1. ✅ Extract structured data (tasks, KPIs, deliverables, metadata)
2. ✅ Identify weak or unmeasurable KPIs
3. ✅ Flag scope creep language and red flags
4. ✅ Detect missing critical elements
5. 🚧 Generate SMART KPI alternatives (Phase 3)
6. 🚧 Compare across contracts for duplication (Phase 4)

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Next.js       │  HTTPS  │   FastAPI       │
│   Frontend      │ ◄─────► │   Backend       │
│   (Vercel)      │         │   (Railway)     │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Claude API     │
                            │  (Anthropic)    │
                            └─────────────────┘
```

### Tech Stack

**Backend:**
- Python 3.12
- FastAPI for REST API
- Anthropic Claude API (Haiku model)
- PyMuPDF (PDF parsing)
- python-docx (DOCX parsing)

**Frontend:**
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Axios for API calls

**Deployment:**
- Backend: Railway (https://railway.app)
- Frontend: Vercel (https://vercel.com)

## 🚀 Features

### Current (MVP)

- **File Upload**: Drag-and-drop interface for PDF, DOCX, TXT files
- **Data Extraction**: Automatically extracts:
  - Contract metadata (ID, contractor, value, dates)
  - Objectives and tasks
  - KPIs and deliverables
  - Scope and personnel requirements
- **Risk Analysis**: Identifies:
  - Weak KPIs (missing targets, baselines, timelines)
  - Scope creep language
  - Missing critical elements
  - Red flags and inconsistencies
- **Beautiful Dashboard**: Color-coded severity levels, downloadable results

### Coming Soon

- **SMART KPI Generator**: AI-generated specific, measurable alternatives
- **Cross-Contract Analysis**: Detect duplicate or overlapping work
- **Batch Processing**: Analyze multiple SOWs at once
- **Historical Comparison**: Track improvements over time

## 📁 Project Structure

```
calhacks/
├── main.py                  # FastAPI backend server
├── sow_extractor.py         # Data extraction
├── risk_analyzer.py         # Risk analysis
├── rag_analyzer.py          # RAG-based overlap detection
├── overlap_analyzer.py      # Overlap detection logic
├── vector_db_setup.py       # Vector database initialization
├── annotated_examples.json  # Training data for RAG
├── requirements.txt         # Python dependencies
├── railway.json             # Railway deployment config
├── sample_nyserda_sow.txt   # Sample SOW for testing
│
├── frontend/                # Next.js frontend
│   ├── app/
│   │   ├── page.tsx        # Main page
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── FileUpload.tsx       # Upload interface
│   │   ├── ResultsDashboard.tsx # Results display
│   │   └── LoginModal.tsx       # Login interface
│   ├── package.json        # Node dependencies
│   └── next.config.js      # Next.js configuration
│
└── chroma_db/              # Vector database storage
```

## 🔧 Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Initialize vector database
python vector_db_setup.py

# Run server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Summary:**

1. **Deploy Backend to Railway**
   - Push to GitHub
   - Connect repo to Railway
   - Add `ANTHROPIC_API_KEY` environment variable
   - Get backend URL

2. **Deploy Frontend to Vercel**
   - Connect GitHub repo to Vercel
   - Set `NEXT_PUBLIC_API_URL` to Railway backend URL
   - Deploy

## 📊 Cost Analysis

| Service | Free Tier | Usage |
|---------|-----------|-------|
| Railway | $5/month credit | Backend hosting |
| Vercel | Unlimited deploys | Frontend hosting |
| Claude API | Pay per use | ~$0.02-0.05 per analysis |

**Total**: Free for <100 analyses/month

## 🧪 Testing

### Test with Sample SOW

Upload the included `sample_nyserda_sow.txt` file through the UI or test API directly:

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@sample_nyserda_sow.txt"
```

### Expected Results

The analyzer should find:
- 14+ issues total
- Weak KPIs like "reduce processing time to target levels"
- Scope creep: "ongoing support as needed"
- Missing elements: specific acceptance criteria

## 🎓 How It Works

### Pass 1: Extraction
- Uses Claude API to extract structured data from raw SOW text
- Identifies: metadata, tasks, KPIs, deliverables, scope
- Returns: JSON with all extracted fields

### Pass 2: Risk Analysis
- Analyzes extracted data for issues
- Categories: weak KPIs, scope creep, missing elements, red flags
- Assigns severity: HIGH, MEDIUM, LOW

### Pass 3: Enhancement (Coming Soon)
- Generates SMART alternatives for weak KPIs
- Provides specific, measurable, achievable recommendations

### Pass 4: Overlap Detection (Coming Soon)
- Compares across multiple SOWs
- Identifies duplicate or overlapping work
- Calculates potential savings

## 🛠️ API Documentation

### POST /api/analyze

Upload and analyze a SOW document.

**Request:**
```
POST /api/analyze
Content-Type: multipart/form-data

file: <PDF/DOCX/TXT file>
```

**Response:**
```json
{
  "success": true,
  "filename": "contract.pdf",
  "contract_id": "SOW-2024-001",
  "contractor": "Example Corp",
  "summary": {
    "total_findings": 14,
    "high_severity": 3,
    "medium_severity": 7,
    "low_severity": 4,
    "tasks_found": 8,
    "kpis_found": 12
  },
  "extracted_data": { ... },
  "analysis": {
    "weak_kpis": [...],
    "scope_creep": [...],
    "missing_elements": [...],
    "red_flags": [...]
  }
}
```

### GET /

Health check endpoint.

**Response:**
```json
{
  "status": "online",
  "service": "SOW Analyzer API",
  "version": "1.0.0"
}
```

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Claude AI](https://anthropic.com) by Anthropic
- Frontend powered by [Next.js](https://nextjs.org)
- Backend powered by [FastAPI](https://fastapi.tiangolo.com)
- Deployed on [Railway](https://railway.app) and [Vercel](https://vercel.com)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Built to detect waste and improve government contracting 🏛️
