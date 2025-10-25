# Procurement SOW & KPI Analyzer - AI Pipeline Passes

## Overview
This document describes the 4-pass AI pipeline that analyzes government contract Statements of Work (SOWs) for waste, duplication, weak KPIs, and scope creep.

**Total Processing Time:** 4-6 minutes for 3 contracts
**LLM Model:** Claude 3.5 Sonnet (via Anthropic API)

---

## Pass 1: Extraction & Structuring
**Goal:** Convert unstructured SOW documents into standardized JSON

### Input
- Raw SOW document (PDF or DOCX)
- Full text extracted via PyMuPDF or python-docx

### What It Does
1. Recognizes government SOW formats (NYSERDA, NOAA, custom)
2. Extracts structured elements:
   - Contract metadata (number, vendor, value, duration)
   - Background and objectives
   - All tasks with descriptions, deliverables, and schedules
   - KPIs and performance metrics
   - Personnel requirements
   - Scope boundaries
   - Reporting requirements
   - Government furnished resources
   - Acceptance criteria

3. For each extracted element, captures:
   - Exact quote from document
   - Page number / section reference
   - Confidence level (high/medium/low)

### Output
```json
{
  "metadata": {
    "contract_id": "ABC-2024-001",
    "contractor": "Acme Consulting",
    "value": "$5,000,000",
    "duration": "24 months"
  },
  "objectives": [
    {
      "text": "Modernize the permit processing system",
      "reference": "Section 2.1, Page 3",
      "confidence": "high"
    }
  ],
  "tasks": [...],
  "deliverables": [...],
  "kpis": [...],
  "personnel_requirements": [...],
  "reporting": [...]
}
```

### Processing Time
~30-60 seconds per document

### Cacheable?
✅ Yes - Results can be stored and reused for subsequent analyses

---

## Pass 2: Individual Document Analysis
**Goal:** Identify risks and weaknesses within a single contract

### Input
- Structured JSON from Pass 1

### What It Does
Analyzes the SOW for 6 categories of issues:

#### 1. Weak or Unmeasurable KPIs
Checks each KPI for:
- ❌ Missing baseline (no current state)
- ❌ Missing target (no goal specified)
- ❌ Missing timeframe (no deadline)
- ❌ Missing measurement method (no survey/tool/system)
- ❌ Vague language ("improve", "enhance", "optimize" without specifics)

**Severity Levels:**
- **HIGH:** Completely unmeasurable (e.g., "improve satisfaction")
- **MEDIUM:** Partially measurable (has metric but no target or timeframe)
- **LOW:** Minor gaps (needs clarification)

#### 2. Scope Creep Language
Flags open-ended phrases that allow unbounded work:
- "ongoing support", "as needed", "as required"
- "reasonable effort", "best effort"
- "and related tasks", "other duties", "etc."
- "assist with", "support" (without specific scope)

#### 3. Missing Critical Elements
Checks for absence of:
- Acceptance criteria
- Assumptions
- Roles and responsibilities
- Government furnished resources
- Out-of-scope statement
- Progress reporting requirements
- Contractor project manager

#### 4. Internal Inconsistencies
Cross-checks within document:
- Objectives without corresponding tasks/deliverables
- Deliverables that don't tie to objectives
- Unrealistic due dates based on dependencies

#### 5. Deliverable Quality Issues
Flags deliverables that are:
- Too vague (e.g., "provide support" vs "submit monthly status report")
- Missing format/content requirements
- Missing due dates
- Missing acceptance criteria

#### 6. Government Contract Red Flags
- Task 0 (Project Management) missing or weak
- No final report requirement
- No kick-off meeting
- Progress reports not specified
- No key personnel identified
- Unclear security/clearance requirements

### Output
```json
{
  "weak_kpis": [
    {
      "kpi_text": "Improve citizen satisfaction",
      "reference": "Section 4.1, Page 10",
      "severity": "HIGH",
      "issue": "No baseline, target, timeframe, or measurement method",
      "risk": "Cannot objectively evaluate contractor performance",
      "estimated_financial_impact": "No accountability for $5M contract outcome"
    }
  ],
  "scope_creep_warnings": [
    {
      "text": "provide ongoing technical support as needed",
      "reference": "Section 5.2, Page 12",
      "severity": "MEDIUM",
      "issue": "'ongoing' and 'as needed' have no defined limits",
      "risk": "Vendor could bill indefinitely; potential $500K+ overrun"
    }
  ],
  "missing_elements": [...],
  "inconsistencies": [...],
  "deliverable_issues": [...],
  "red_flags": [...]
}
```

### Processing Time
~30-45 seconds per document

### Cacheable?
✅ Yes - Findings stored for report generation

---

## Pass 3: KPI Enhancement & Suggestions
**Goal:** Generate SMART alternatives for weak KPIs

### Input
- Weak KPIs from Pass 2
- Contract context (objectives, deliverables, duration) from Pass 1

### What It Does
For each weak KPI, creates 2-3 SMART alternatives:
- **Specific:** Exactly what is being measured
- **Measurable:** Quantifiable metric
- **Achievable:** Realistic given context
- **Relevant:** Ties to contract objectives
- **Time-bound:** Has deadline/timeframe

Each suggestion includes:
- Complete KPI statement
- Baseline (current state)
- Target (goal to achieve)
- Timeframe (deadline)
- Measurement method (survey, system, report, tool)
- Data collection frequency
- Justification (why this is better)

### Example Output
```json
{
  "original_kpi": "Improve citizen satisfaction",
  "weakness": "No baseline, target, timeframe, or measurement method",
  "suggestions": [
    {
      "smart_kpi": "Increase average citizen satisfaction score from 3.2 to 4.0 (on 5-point scale) within 12 months of platform launch, measured via quarterly online survey with minimum 500 responses per quarter",
      "baseline": "Current average: 3.2/5.0 (from 2023 annual survey)",
      "target": "4.0/5.0",
      "timeframe": "Within 12 months of platform launch",
      "measurement_method": "Online survey sent to all permit applicants",
      "collection_frequency": "Quarterly surveys; annual average calculated",
      "justification": "Specific, measurable via existing survey infrastructure, realistic 0.8-point improvement"
    },
    {
      "smart_kpi": "Reduce average permit processing time from 14 business days to 5 business days by Month 18",
      "baseline": "Current average: 14 business days",
      "target": "5 business days",
      "timeframe": "By Month 18 of contract",
      "measurement_method": "Automated tracking via new permit system timestamps",
      "collection_frequency": "Real-time system tracking; monthly reports",
      "justification": "Objective metric, automatically tracked, satisfaction correlates with speed"
    }
  ],
  "government_best_practice_reference": "Performance-Based Contracting (GAO-02-1049) recommends measurable outcomes"
}
```

### Processing Time
~20-30 seconds per document (only runs on weak KPIs, not entire SOW)

### Cacheable?
✅ Yes - Suggestions stored for dashboard display

---

## Pass 4: Cross-Document Overlap Detection
**Goal:** Find duplication, dependencies, and conflicts across multiple contracts

### Input
- All structured JSONs from Pass 1 (for all contracts)
- Analysis findings from Pass 2 (for context)

### What It Does
Compares all contracts to identify:

#### 1. Duplicate Deliverables
Finds semantically similar deliverables across contracts:
- "Migrate legacy permit data" ≈ "Transfer legacy records to new system"
- "Conduct user satisfaction survey" ≈ "Survey citizen feedback"

**Similarity Levels:**
- **EXACT:** Same wording, definitely duplicate
- **HIGH:** Same work, different wording (80%+ overlap)
- **MEDIUM:** Partial overlap (50-80%)

Calculates:
- Scope overlap percentage
- Financial impact (duplicative spending)
- Whether same vendor or different vendors

#### 2. Overlapping Objectives/Tasks
Flags when 2+ contracts pursue similar goals:
- Multiple "IT modernization" contracts
- Multiple "staff training" contracts
- Multiple contracts working on same system

#### 3. Missing Dependencies
Identifies cross-contract dependencies not explicitly referenced:
- Contract B (Training) depends on Contract A (System) but doesn't cite it
- Contract C assumes Contract A finishes Month 6, but A shows Month 9
- Contract references "the new system" generically without citing source contract

#### 4. Timeline Conflicts
- Contract B starts before Contract A finishes (but B depends on A)
- Two contracts deliver same thing by different dates
- Conflicting reporting schedules

#### 5. Contradictory Approaches
- Contract A: "Implement off-the-shelf CRM"
- Contract B: "Build custom CRM"
- Both addressing same need = waste or conflict

#### 6. Vendor Overlap Analysis
When same vendor appears in multiple contracts:
- Similar work that could be consolidated?
- Coordination mechanism exists?

### Output
```json
{
  "finding_type": "duplicate_deliverable",
  "severity": "HIGH",
  "contracts_involved": ["Contract ABC-001", "Contract ABC-002"],
  "details": {
    "contract_1": {
      "text": "Migrate 500,000 legacy permit records",
      "location": "Task 1, Section 3.4, Page 8",
      "contract_value": "$5,000,000"
    },
    "contract_2": {
      "text": "Transfer legacy data to new integrated databases",
      "location": "Task 2.1, Page 5",
      "contract_value": "$3,000,000"
    }
  },
  "similarity": "HIGH - Both migrating same permit dataset",
  "overlap_percentage": "~80%",
  "financial_impact": "$800,000 duplicative cost",
  "risk": "Agency paying two vendors to migrate same data; potential data conflicts",
  "recommendation": "Assign all permit data migration to Contract ABC-001; remove from ABC-002 and reduce budget by $800K",
  "action_required": "Contract modification to remove scope from ABC-002"
}
```

### Processing Time
~60-90 seconds (for 3 contracts compared)

### Cacheable?
❌ No - Must rerun when new contracts added to comparison set

---

## Complete Pipeline Flow

```
┌─────────────────────┐
│  Upload SOW Files   │
│  (PDF/DOCX)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PASS 1: Extract    │──────► Cache JSON
│  30-60s per doc     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PASS 2: Analyze    │──────► Cache Findings
│  30-45s per doc     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PASS 3: Enhance    │──────► Cache Suggestions
│  20-30s per doc     │        (Optional - can skip)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PASS 4: Compare    │
│  60-90s all docs    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generate Report    │
│  - Risk Memo        │
│  - KPI Dashboard    │
│  - Overlap Matrix   │
└─────────────────────┘
```

---

## Cost Estimation

**Using Claude 3.5 Sonnet:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Typical SOW Analysis (20-page document):**
- Pass 1: ~$0.10-0.15 (large input, structured output)
- Pass 2: ~$0.05-0.08 (JSON input, detailed output)
- Pass 3: ~$0.03-0.05 (small input, suggestions output)
- Pass 4: ~$0.08-0.12 (multiple JSONs input)

**Total per SOW:** ~$0.26-0.40
**For 3 SOWs:** ~$0.80-1.20

**MVP Budget:** $10-20 for development/testing (25-50 SOW analyses)

---

## Key Design Decisions

### Why 4 Passes Instead of 1?
1. **Modularity:** Can run Pass 1-2 only for quick scan
2. **Caching:** Pass 1 results reused for different analyses
3. **Parallelization:** Passes 1-3 run on all docs simultaneously
4. **Debugging:** If one pass fails, others still work
5. **Cost Optimization:** Pass 3 (enhancement) is optional
6. **Extensibility:** Easy to add Pass 5 for new features

### Why All-LLM vs Hybrid?
- **Simplicity:** Single API, consistent quality
- **Speed-to-market:** No training required for embeddings/classifiers
- **Flexibility:** Easy to adjust prompts based on feedback
- **Government context:** LLM understands nuanced policy language better than regex
- **Cost acceptable:** $0.30/SOW is minimal vs. consultant costs ($200+/hr)

### What About Accuracy?
- **Citations:** Every finding includes page/section reference (verifiable)
- **Confidence scores:** Pass 1 includes confidence levels
- **Human-in-loop:** Findings are recommendations, not automatic actions
- **Audit trail:** Full JSON output stored for review

---

## Next Steps for Implementation

1. **Build Pass 1** - Extraction proof-of-concept
2. **Test on sample SOWs** - Validate JSON structure
3. **Build Pass 2** - Individual analysis
4. **Create frontend** - Upload interface + results display
5. **Build Pass 4** - Cross-document comparison
6. **Build Pass 3** - KPI enhancement (last, since it's optional)
7. **Generate reports** - PDF/dashboard output
