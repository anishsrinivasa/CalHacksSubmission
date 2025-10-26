"""
Pass 1: SOW Extraction - Convert unstructured SOW to structured JSON
"""
import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

EXTRACTION_PROMPT = """You are analyzing a government contract Statement of Work (SOW).

Government SOWs typically follow one of these structures:
- NYSERDA format: Background, Definitions, Task 0 (Project Management), Task 1-N, Task X (Final Report)
- NOAA format: 9 sections including General, Tasks, Personnel, Deliverables table
- Custom variations of the above

Extract the following into structured JSON:

CONTRACT METADATA:
- Contract/Project number (if present)
- Contractor name (if present)
- Project title
- Contract value/budget (if mentioned)
- Period of performance

BACKGROUND/OBJECTIVES:
- What problem is being solved?
- What are the high-level goals?

TASKS/REQUIREMENTS:
For each task, extract:
- Task number/ID (e.g., "Task 0", "Task 1", "2.1")
- Task title
- Task description (what contractor shall do)
- Deliverables for this task
- Schedule/due date
- Page/section reference

KPIS/PERFORMANCE METRICS:
Extract any measurable outcomes, success criteria, or performance targets mentioned:
- The metric text exactly as written
- What it measures
- Target/baseline (if specified)
- Timeframe (if specified)
- Measurement method (if specified)
- Location in document

DELIVERABLES:
- Deliverable name/description
- Associated task
- Due date
- Format (report, presentation, data, etc.)
- Distribution/recipients

SCOPE BOUNDARIES:
- What's explicitly in scope?
- What's explicitly out of scope? (if mentioned)

CONTRACTOR PERSONNEL REQUIREMENTS:
- Required qualifications, certifications, clearances
- Key personnel positions
- Project manager requirements
- Staffing levels (if specified)

OTHER REQUIREMENTS:
- Security/clearance requirements
- Travel requirements
- Reporting frequency (progress reports, metrics, meetings)
- Government furnished resources
- Section 508 / accessibility requirements
- Acceptance criteria

For each extracted item, include:
- Exact quote from document (if applicable)
- Page number or section reference (if discernible)
- Confidence level (high/medium/low)

If a section is completely absent, note it as "NOT_FOUND".

Return ONLY valid JSON with no additional text. Use this structure:

{
  "metadata": {
    "contract_id": "string or null",
    "contractor": "string or null",
    "project_title": "string or null",
    "value": "string or null",
    "duration": "string or null"
  },
  "background": {
    "problem_statement": "string or NOT_FOUND",
    "reference": "string or null",
    "confidence": "high/medium/low"
  },
  "objectives": [
    {
      "text": "string",
      "reference": "string",
      "confidence": "high/medium/low"
    }
  ],
  "tasks": [
    {
      "task_id": "string",
      "title": "string or null",
      "description": "string",
      "deliverables": ["string"],
      "schedule": "string or null",
      "reference": "string",
      "confidence": "high/medium/low"
    }
  ],
  "kpis": [
    {
      "text": "string",
      "measures": "string or null",
      "target": "string or null",
      "baseline": "string or null",
      "timeframe": "string or null",
      "measurement_method": "string or null",
      "reference": "string",
      "confidence": "high/medium/low"
    }
  ],
  "deliverables": [
    {
      "name": "string",
      "associated_task": "string or null",
      "due_date": "string or null",
      "format": "string or null",
      "distribution": "string or null",
      "reference": "string",
      "confidence": "high/medium/low"
    }
  ],
  "scope": {
    "in_scope": ["string"],
    "out_of_scope": ["string"] or "NOT_FOUND"
  },
  "personnel_requirements": {
    "qualifications": ["string"] or "NOT_FOUND",
    "key_personnel": ["string"] or "NOT_FOUND",
    "project_manager_required": true or false,
    "clearance_level": "string or null"
  },
  "other_requirements": {
    "security": "string or NOT_FOUND",
    "travel": "string or NOT_FOUND",
    "progress_reporting": "string or NOT_FOUND",
    "government_furnished": ["string"] or "NOT_FOUND",
    "section_508": "string or NOT_FOUND",
    "acceptance_criteria": "string or NOT_FOUND"
  }
}

<document>
{document_text}
</document>"""


def extract_sow_data(document_text: str, model: str = "claude-3-haiku-20240307") -> dict:
    """
    Extract structured data from SOW document text using Claude

    Args:
        document_text: Full text of the SOW document
        model: Claude model to use

    Returns:
        Dictionary with extracted structured data
    """
    prompt = EXTRACTION_PROMPT.replace("{document_text}", document_text)

    print(f"Calling Claude API for extraction...")
    print(f"Document length: {len(document_text)} characters")

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    response_text = message.content[0].text

    # Parse JSON response - handle cases where Claude adds explanatory text before/after JSON
    try:
        # Try direct parsing first
        extracted_data = json.loads(response_text)
        print(f"[OK] Extraction successful")
        return extracted_data
    except json.JSONDecodeError as e:
        # If direct parsing fails, try to extract JSON from the response
        print(f"[ERROR] Direct JSON parsing failed, attempting to extract JSON from response...")

        # Look for JSON object in the response by finding matching braces
        json_start = response_text.find('{')

        if json_start == -1:
            print(f"[ERROR] Could not find JSON in response")
            print(f"Response: {response_text[:500]}...")
            raise

        # Count braces to find the matching closing brace
        brace_count = 0
        json_end = -1

        for i in range(json_start, len(response_text)):
            if response_text[i] == '{':
                brace_count += 1
            elif response_text[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    json_end = i
                    break

        if json_end != -1:
            json_str = response_text[json_start:json_end + 1]
            try:
                extracted_data = json.loads(json_str)
                print(f"[OK] Extraction successful after JSON extraction")
                return extracted_data
            except json.JSONDecodeError as e2:
                print(f"[ERROR] JSON extraction also failed: {e2}")
                print(f"Response: {response_text[:500]}...")
                raise
        else:
            print(f"[ERROR] Could not find matching closing brace")
            print(f"Response: {response_text[:500]}...")
            raise


def extract_from_file(file_path: str) -> dict:
    """
    Extract structured data from SOW file (PDF or DOCX)

    Args:
        file_path: Path to SOW document

    Returns:
        Dictionary with extracted structured data
    """
    # Import document parsing utilities
    if file_path.lower().endswith('.pdf'):
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text_parts = []
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text()
            text_parts.append(f"[Page {page_num}]\n{text}")
        doc.close()
        document_text = "\n\n".join(text_parts)
    elif file_path.lower().endswith('.docx'):
        from docx import Document
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        document_text = "\n\n".join(paragraphs)
    elif file_path.lower().endswith('.txt'):
        with open(file_path, 'r', encoding='utf-8') as f:
            document_text = f.read()
    else:
        raise ValueError(f"Unsupported file type: {file_path}")

    print(f"\nProcessing: {file_path}")

    # Extract structured data
    extracted_data = extract_sow_data(document_text)

    # Add raw text for RAG analysis
    extracted_data['raw_text'] = document_text

    return extracted_data


if __name__ == "__main__":
    # Test with a sample SOW file
    import sys

    if len(sys.argv) < 2:
        print("Usage: python pass1_extraction.py <sow_file_path>")
        print("Example: python pass1_extraction.py sample_sow.pdf")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    # Extract data
    extracted = extract_from_file(input_file)

    # Save to JSON file
    output_file = input_file.rsplit('.', 1)[0] + '_extracted.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extracted, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Extraction complete!")
    print(f"[OK] Results saved to: {output_file}")

    # Print summary
    print(f"\n--- Summary ---")
    print(f"Contract ID: {extracted.get('metadata', {}).get('contract_id', 'N/A')}")
    print(f"Contractor: {extracted.get('metadata', {}).get('contractor', 'N/A')}")
    print(f"Tasks found: {len(extracted.get('tasks', []))}")
    print(f"KPIs found: {len(extracted.get('kpis', []))}")
    print(f"Deliverables found: {len(extracted.get('deliverables', []))}")
