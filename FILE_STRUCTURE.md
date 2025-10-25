# Backend File Structure

## Core Analysis Files

| File | Purpose | Pass |
|------|---------|------|
| `sow_extractor.py` | Extract structured data from SOW documents | Pass 1 |
| `risk_analyzer.py` | Analyze individual SOWs for red flags (weak KPIs, scope creep, etc.) | Pass 2 |
| `kpi_enhancer.py` | Generate SMART KPI alternatives for weak metrics | Pass 3 |
| `overlap_detector.py` | Compare multiple SOWs to find duplicates and dependencies | Pass 4 |

## Utility Files

| File | Purpose |
|------|---------|
| `document_parser.py` | PDF/DOCX text extraction utilities |
| `config.py` | Configuration and environment variables |
| `prompts.py` | All Claude API prompts in one place |
| `models.py` | Pydantic models for data validation |

## Execution Scripts

| File | Purpose |
|------|---------|
| `analyze_sow.py` | CLI tool to run full analysis on single SOW |
| `compare_sows.py` | CLI tool to compare multiple SOWs |
| `main.py` | FastAPI server for web frontend |

## Current Status

✅ `sow_extractor.py` - Complete
⏳ `risk_analyzer.py` - Not started
⏳ `kpi_enhancer.py` - Not started
⏳ `overlap_detector.py` - Not started
⏳ Other files - Not started
