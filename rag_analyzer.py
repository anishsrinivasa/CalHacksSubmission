"""
RAG-Enhanced SOW Analyzer
Combines vector database retrieval with Claude validation
"""
import os
import json
from typing import List, Dict
from anthropic import Anthropic
from dotenv import load_dotenv
from vector_db_setup import search_similar_patterns, initialize_vector_db

load_dotenv()

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Initialize vector DB on module load
print("Initializing vector database...")
try:
    initialize_vector_db()  # No parameters needed
    print("[OK] Vector database ready")
except Exception as e:
    print(f"[WARNING] Warning: Vector DB initialization failed: {e}")
    print(f"   Run 'python vector_db_setup.py' to create the database")
    print(f"   RAG analysis will fall back to basic analysis")


def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    """
    Split text into chunks of approximately chunk_size words

    Args:
        text: Full text to chunk
        chunk_size: Approximate number of words per chunk

    Returns:
        List of text chunks
    """
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks


def extract_full_text_from_sow(extracted_data: dict) -> str:
    """
    Extract all text content from SOW data for chunking

    Args:
        extracted_data: Dictionary from Pass 1 (sow_extractor.py)

    Returns:
        Full text of SOW
    """
    # IMPORTANT: Use raw_text if available (contains the FULL original document)
    # This ensures we analyze ALL sections, not just structured extractions
    if 'raw_text' in extracted_data:
        return extracted_data['raw_text']

    # Fallback: reconstruct from structured data (may miss some content)
    text_parts = []

    # Background
    if extracted_data.get('background', {}).get('problem_statement') != 'NOT_FOUND':
        text_parts.append(extracted_data['background']['problem_statement'])

    # Objectives
    for obj in extracted_data.get('objectives', []):
        text_parts.append(obj['text'])

    # Tasks
    for task in extracted_data.get('tasks', []):
        task_text = f"Task {task['task_id']}: {task.get('title', '')} - {task['description']}"
        text_parts.append(task_text)

    # KPIs
    for kpi in extracted_data.get('kpis', []):
        text_parts.append(kpi['text'])

    # Deliverables
    for deliv in extracted_data.get('deliverables', []):
        text_parts.append(f"Deliverable: {deliv['name']}")

    return '\n\n'.join(text_parts)


VALIDATION_PROMPT = """You are an experienced government contract auditor analyzing an uploaded SOW for problematic language patterns.

You have been provided with similar problematic patterns from REAL government contracts that caused significant cost overruns.

<uploaded_sow_section>
{sow_section}
</uploaded_sow_section>

<similar_patterns_from_real_contracts>
{similar_patterns}
</similar_patterns_from_real_contracts>

Your task is to determine if the uploaded SOW section contains the SAME TYPE of issue as the real examples.

IMPORTANT - Only flag as an issue if BOTH conditions are true:
1. The uploaded SOW uses similar language to the problematic examples (e.g., "full range", "all resources", "ample time", "best efforts", "periodically")
2. AND the language is unbounded/vague WITHOUT proper qualification

DO NOT flag as an issue if:
- The phrase is followed by specific definitions, subsections, or references (e.g., "as defined in Section 5")
- There are clear boundaries mentioned (budget limits, task orders, specific deliverables)
- The language is standard IDIQ contract boilerplate that's properly contextualized
- The document provides specific subsections that enumerate the scope immediately after

Examples:
- "full range of support that may be required from time to time" ← FLAG (unbounded, no specifics)
- "full range of services as defined in individual task orders per Section 5.1-5.6" ← DO NOT FLAG (bounded by task orders and specific sections)
- "ample time" ← FLAG (no minimum time specified)
- "minimum 10 business days notice" ← DO NOT FLAG (specific)

Return ONLY valid JSON (no additional text):

{{
  "has_issue": true or false,
  "issue_type": "weak_kpi|scope_creep|missing_element|red_flag|etc",
  "severity": "HIGH|MEDIUM|LOW",
  "explanation": "1-2 sentence explanation of how this mirrors the real example",
  "problematic_text": "exact quote from uploaded SOW",
  "location": "section reference if available",
  "matched_example": {{
    "contract_source": "string",
    "similarity_score": 0.0-1.0,
    "actual_outcome": "string",
    "estimated_cost": "string"
  }},
  "remediation": "Specific suggestion for how to fix this (1-2 sentences)"
}}

If the uploaded SOW section does NOT have the same issue, return: {{"has_issue": false}}
"""


def validate_with_claude(
    sow_section: str,
    similar_patterns: List[Dict],
    model: str = "claude-3-haiku-20240307"
) -> Dict:
    """
    Use Claude to validate if similar issues exist in uploaded SOW section

    Args:
        sow_section: Chunk of uploaded SOW
        similar_patterns: Top matches from vector DB
        model: Claude model to use

    Returns:
        Validation result dictionary
    """
    # Format similar patterns for prompt
    patterns_text = ""
    for i, pattern in enumerate(similar_patterns, 1):
        patterns_text += f"\n--- Example {i} (Similarity: {pattern['similarity_score']:.2f}) ---\n"
        patterns_text += f"Problematic Text: {pattern['problematic_section']}\n"
        patterns_text += f"Issue Type: {pattern['issue_type']}\n"
        patterns_text += f"Why Problematic: {pattern['explanation']}\n"
        patterns_text += f"What Happened: {pattern['actual_outcome']}\n"
        patterns_text += f"Cost Impact: {pattern['estimated_cost']}\n"
        patterns_text += f"Source: {pattern['contract_source']}\n"

    prompt = VALIDATION_PROMPT.replace("{sow_section}", sow_section)
    prompt = prompt.replace("{similar_patterns}", patterns_text)

    try:
        message = client.messages.create(
            model=model,
            max_tokens=2048,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        response_text = message.content[0].text

        # Extract JSON
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            json_text = response_text[json_start:json_end]
        else:
            json_text = response_text

        return json.loads(json_text)

    except Exception as e:
        print(f"[WARNING] Claude validation error: {e}")
        return {"has_issue": False, "error": str(e)}


def analyze_sow_with_rag(
    extracted_data: dict,
    top_k_matches: int = 5,
    chunk_size: int = 200
) -> dict:
    """
    Analyze SOW using RAG approach:
    1. Chunk the SOW
    2. For each chunk, find similar patterns in vector DB
    3. Use Claude to validate if issue exists
    4. Aggregate results

    Args:
        extracted_data: Dictionary from Pass 1 (sow_extractor.py)
        top_k_matches: Number of similar patterns to retrieve per chunk
        chunk_size: Words per chunk

    Returns:
        Enhanced analysis with matched examples
    """
    print(f"\n[RAG] Starting RAG-enhanced analysis...")

    # Extract full text
    full_text = extract_full_text_from_sow(extracted_data)
    print(f"   Extracted {len(full_text)} characters")

    # Chunk text
    chunks = chunk_text(full_text, chunk_size=chunk_size)
    print(f"   Split into {len(chunks)} chunks")

    # Analyze each chunk
    all_findings = []
    chunks_analyzed = 0

    for i, chunk in enumerate(chunks):
        if len(chunk.strip()) < 50:  # Skip very short chunks
            continue

        chunks_analyzed += 1
        print(f"   Analyzing chunk {chunks_analyzed}/{len(chunks)}...")

        # Search vector DB for similar patterns
        similar_patterns = search_similar_patterns(chunk, n_results=top_k_matches)

        if not similar_patterns:
            continue

        # Use Claude to validate
        validation = validate_with_claude(chunk, similar_patterns)

        if validation.get('has_issue', False):
            # Add the best matched example details
            if similar_patterns:
                validation['matched_example'] = {
                    "contract_source": similar_patterns[0]['contract_source'],
                    "similarity_score": similar_patterns[0]['similarity_score'],
                    "actual_outcome": similar_patterns[0]['actual_outcome'],
                    "estimated_cost": similar_patterns[0]['estimated_cost'],
                    "correct_version": similar_patterns[0]['correct_version']
                }

            all_findings.append(validation)

    print(f"[OK] Found {len(all_findings)} validated issues")

    # Group findings by issue type
    grouped_findings = {
        "weak_kpis": [],
        "scope_creep": [],
        "missing_elements": [],
        "red_flags": [],
        "deliverable_issues": [],
        "inconsistencies": []
    }

    for finding in all_findings:
        issue_type = finding.get('issue_type', 'inconsistencies')

        # Normalize field names to match frontend expectations
        normalized_finding = {
            'severity': finding.get('severity', 'MEDIUM'),
            'issue': finding.get('explanation', ''),
            'text': finding.get('problematic_text', ''),
            'location': finding.get('location', 'Unknown'),
            'matched_example': finding.get('matched_example'),
            'remediation': finding.get('remediation', '')
        }

        # Add type-specific fields
        if issue_type == 'missing_element':
            normalized_finding['element'] = finding.get('problematic_text', 'Missing element')

        # Map issue types to categories
        if issue_type == 'weak_kpi':
            grouped_findings['weak_kpis'].append(normalized_finding)
        elif issue_type == 'scope_creep':
            grouped_findings['scope_creep'].append(normalized_finding)
        elif issue_type == 'missing_element':
            grouped_findings['missing_elements'].append(normalized_finding)
        elif issue_type == 'red_flag':
            grouped_findings['red_flags'].append(normalized_finding)
        elif issue_type == 'deliverable_issue':
            grouped_findings['deliverable_issues'].append(normalized_finding)
        else:
            grouped_findings['inconsistencies'].append(normalized_finding)

    return grouped_findings


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python rag_analyzer.py <extracted_json_path>")
        print("Example: python rag_analyzer.py sample_sow_extracted.json")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    # Load extracted data
    with open(input_file, 'r', encoding='utf-8') as f:
        extracted = json.load(f)

    # Analyze with RAG
    analysis = analyze_sow_with_rag(extracted)

    # Save results
    output_file = input_file.replace('_extracted.json', '_rag_analysis.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] RAG analysis saved to: {output_file}")

    # Print summary
    total = sum(len(findings) for findings in analysis.values())
    print(f"\n[SUMMARY] Found {total} issues with matched real-world examples:")
    for category, findings in analysis.items():
        if findings:
            print(f"   - {category}: {len(findings)}")
