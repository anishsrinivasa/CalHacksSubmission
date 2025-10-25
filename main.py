"""
FastAPI Backend for SOW Analyzer
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
from typing import List
import tempfile
from datetime import datetime

# Import our analysis modules
from sow_extractor import extract_from_file
from risk_analyzer import analyze_sow

app = FastAPI(
    title="SOW Analyzer API",
    description="AI-powered analysis of government contract Statements of Work",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "SOW Analyzer API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "health": "/health"
        }
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "api_key_configured": bool(os.getenv("ANTHROPIC_API_KEY"))
    }


@app.post("/api/analyze")
async def analyze_sow_file(file: UploadFile = File(...)):
    """
    Analyze a single SOW file

    Accepts: PDF, DOCX, or TXT file
    Returns: Extraction data + Risk analysis
    """
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Validate file size (10MB limit)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size: 10MB"
        )

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Step 1: Extract structured data
        print(f"[1/2] Extracting data from {file.filename}...")
        extracted_data = extract_from_file(tmp_path)

        # Step 2: Analyze for risks
        print(f"[2/2] Analyzing risks...")
        analysis = analyze_sow(extracted_data)

        # Clean up temp file
        os.unlink(tmp_path)

        # Calculate summary statistics
        all_findings = []
        for category in ['weak_kpis', 'scope_creep', 'missing_elements',
                         'inconsistencies', 'deliverable_issues', 'red_flags']:
            findings = analysis.get(category, [])
            all_findings.extend(findings)

        high_count = sum(1 for f in all_findings if f.get('severity') == 'HIGH')
        medium_count = sum(1 for f in all_findings if f.get('severity') == 'MEDIUM')
        low_count = sum(1 for f in all_findings if f.get('severity') == 'LOW')

        # Return combined results
        return {
            "success": True,
            "filename": file.filename,
            "contract_id": extracted_data.get("metadata", {}).get("contract_id"),
            "contractor": extracted_data.get("metadata", {}).get("contractor"),
            "summary": {
                "total_findings": len(all_findings),
                "high_severity": high_count,
                "medium_severity": medium_count,
                "low_severity": low_count,
                "tasks_found": len(extracted_data.get("tasks", [])),
                "kpis_found": len(extracted_data.get("kpis", [])),
                "deliverables_found": len(extracted_data.get("deliverables", []))
            },
            "extracted_data": extracted_data,
            "analysis": analysis
        }

    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/api/analyze-batch")
async def analyze_multiple_sows(files: List[UploadFile] = File(...)):
    """
    Analyze multiple SOW files

    Returns: Array of analysis results
    """
    if len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 files allowed per batch"
        )

    results = []

    for file in files:
        try:
            # Reuse single file analysis
            result = await analyze_sow_file(file)
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "success": True,
        "total_files": len(files),
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
