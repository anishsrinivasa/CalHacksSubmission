# SOW Analyzer Backend

AI-powered analysis of government contract Statements of Work (SOWs).

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure API Key

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get your API key from: https://console.anthropic.com/

## Usage

### Extract SOW Data

Extract structured data from a SOW document (PDF, DOCX, or TXT):

```bash
python sow_extractor.py <path_to_sow_file>
```

**Example:**
```bash
python sow_extractor.py sample_nyserda_sow.txt
```

**Output:**
- Creates `<filename>_extracted.json` with structured data
- Prints summary to console

**Supported formats:**
- PDF (`.pdf`)
- Word (`.docx`)
- Plain text (`.txt`)

### What Pass 1 Extracts

- ✅ Contract metadata (ID, contractor, value, duration)
- ✅ Background and objectives
- ✅ All tasks with descriptions, deliverables, schedules
- ✅ KPIs and performance metrics
- ✅ Deliverables list
- ✅ Scope boundaries
- ✅ Personnel requirements
- ✅ Security, travel, reporting requirements

### Example Output

```json
{
  "metadata": {
    "contract_id": "ABC-2024-001",
    "contractor": "Acme Consulting",
    "project_title": "IT Modernization Project",
    "value": "$5,000,000",
    "duration": "24 months"
  },
  "objectives": [
    {
      "text": "Modernize the permit processing system",
      "reference": "Section 1.1, Page 3",
      "confidence": "high"
    }
  ],
  "tasks": [
    {
      "task_id": "Task 1",
      "title": "System Design",
      "description": "The Contractor shall design a new cloud-based permit system...",
      "deliverables": ["System Architecture Document", "Design Mockups"],
      "schedule": "Month 3",
      "reference": "Section 2.1, Page 5",
      "confidence": "high"
    }
  ],
  "kpis": [
    {
      "text": "Improve citizen satisfaction",
      "measures": "User satisfaction",
      "target": null,
      "baseline": null,
      "timeframe": null,
      "measurement_method": null,
      "reference": "Section 4.1, Page 10",
      "confidence": "medium"
    }
  ]
}
```

## Coming Soon

- **Pass 2:** Individual document analysis (weak KPIs, scope creep, red flags)
- **Pass 3:** SMART KPI suggestions
- **Pass 4:** Cross-document overlap detection

## Cost

Pass 1 uses Claude 3.5 Sonnet:
- **~$0.10-0.15** per 20-page SOW
- Input: $3/million tokens
- Output: $15/million tokens

## Troubleshooting

**"ANTHROPIC_API_KEY not found"**
- Make sure `.env` file exists in `/backend/` directory
- Check that your API key is correct

**"Unsupported file type"**
- Only PDF, DOCX, and TXT files are supported
- Make sure file extension matches file format

**JSON parsing error**
- The AI response may not be valid JSON
- Check console output for the raw response
- Try running again (occasionally happens with very large documents)
# Calhacks
