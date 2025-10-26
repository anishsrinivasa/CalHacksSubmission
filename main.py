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

# Try to import RAG analyzer (may fail if dependencies not installed)
try:
    from rag_analyzer import analyze_sow_with_rag
    RAG_AVAILABLE = True
    print("[OK] RAG analysis available")
except ImportError as e:
    RAG_AVAILABLE = False
    print(f"[WARNING] RAG analysis not available: {e}")
    print(f"   Install with: pip install chromadb sentence-transformers torch")
    print(f"   Using basic analysis for now...")

# Try to import overlap analyzer
try:
    from overlap_analyzer import analyze_overlap
    OVERLAP_AVAILABLE = True
    print("[OK] Overlap analysis available")
except ImportError as e:
    OVERLAP_AVAILABLE = False
    print(f"[WARNING] Overlap analysis not available: {e}")

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
async def analyze_sow_file(files: List[UploadFile] = File(...)):
    """
    Analyze one or more SOW files

    Accepts: PDF, DOCX, or TXT files
    Returns: Extraction data + Risk analysis + Overlap analysis (if multiple files)
    """
    # Handle both single and multiple files
    if not isinstance(files, list):
        files = [files]

    allowed_extensions = ['.pdf', '.docx', '.txt']
    temp_files = []
    results = []

    try:
        # Process each file
        for idx, file in enumerate(files):
            # Validate file type
            file_ext = os.path.splitext(file.filename)[1].lower()

            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type '{file.filename}'. Allowed: {', '.join(allowed_extensions)}"
                )

            # Validate file size (10MB limit)
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{file.filename}' too large. Maximum size: 10MB"
                )

            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
                temp_files.append(tmp_path)

            # Step 1: Extract structured data
            print(f"[{idx+1}/{len(files)}] Extracting data from {file.filename}...")
            extracted_data = extract_from_file(tmp_path)

            # Read raw text for overlap analysis
            with open(tmp_path, 'r', encoding='utf-8', errors='ignore') as f:
                raw_text = f.read() if file_ext == '.txt' else extracted_data.get('raw_text', '')

            # Step 2: Analyze for risks using RAG (with fallback to basic analysis)
            if RAG_AVAILABLE:
                print(f"   Analyzing with RAG (searching vector database)...")
                try:
                    analysis = analyze_sow_with_rag(extracted_data)
                    print(f"   [OK] RAG analysis complete")
                except Exception as e:
                    print(f"   [WARNING] RAG analysis error: {str(e)}")
                    print(f"   Falling back to basic analysis...")
                    analysis = analyze_sow(extracted_data)
                    print(f"   [OK] Basic analysis complete")
            else:
                print(f"   Analyzing with basic analyzer...")
                analysis = analyze_sow(extracted_data)
                print(f"   [OK] Basic analysis complete")

            # Calculate summary statistics
            all_findings = []
            for category in ['weak_kpis', 'scope_creep', 'missing_elements',
                             'inconsistencies', 'deliverable_issues', 'red_flags']:
                findings = analysis.get(category, [])
                all_findings.extend(findings)

            high_count = sum(1 for f in all_findings if f.get('severity') == 'HIGH')
            medium_count = sum(1 for f in all_findings if f.get('severity') == 'MEDIUM')
            low_count = sum(1 for f in all_findings if f.get('severity') == 'LOW')

            # Store result for this file
            results.append({
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
                "analysis": analysis,
                "raw_text": raw_text  # Store for overlap analysis
            })

        # Step 3: Overlap analysis if multiple files
        overlap_analysis = None
        if len(files) >= 2 and OVERLAP_AVAILABLE:
            print(f"\n[Overlap] Analyzing overlap between {len(files)} SOWs...")

            sow_data_list = [
                {
                    "filename": result["filename"],
                    "raw_text": result["raw_text"],
                    "extracted_data": result["extracted_data"]
                }
                for result in results
            ]

            overlap_analysis = analyze_overlap(sow_data_list)
            print(f"[Overlap] [OK] Overlap analysis complete")

        # Clean up temp files
        for tmp_path in temp_files:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

        # Return results based on number of files
        if len(files) == 1:
            # Single file - return as before (backward compatible)
            result = results[0]
            return {
                "success": True,
                "filename": result["filename"],
                "contract_id": result["contract_id"],
                "contractor": result["contractor"],
                "summary": result["summary"],
                "extracted_data": result["extracted_data"],
                "analysis": result["analysis"]
            }
        else:
            # Multiple files - return array with overlap analysis
            # For frontend, we'll return the first file's analysis + overlap
            # (Frontend will display first file's results + overlap tile/section)
            return {
                "success": True,
                "multiple_files": True,
                "file_count": len(files),
                "filename": results[0]["filename"],  # Primary file
                "contract_id": results[0]["contract_id"],
                "contractor": results[0]["contractor"],
                "summary": results[0]["summary"],
                "extracted_data": results[0]["extracted_data"],
                "analysis": results[0]["analysis"],
                "overlap_analysis": overlap_analysis,
                "all_results": results  # Include all results for future use
            }

    except Exception as e:
        # Clean up temp files if they exist
        for tmp_path in temp_files:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

        # Print full error traceback for debugging
        import traceback
        print(f"\n{'='*70}")
        print(f"ERROR: Analysis failed")
        print(f"{'='*70}")
        traceback.print_exc()
        print(f"{'='*70}\n")

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
