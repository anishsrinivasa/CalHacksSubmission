"""
Overlap Analysis - Detect redundant work across multiple SOWs
"""
import os
import json
import re
from typing import List, Dict, Optional
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

OVERLAP_PROMPT = """You are analyzing multiple government contract Statements of Work (SOWs) for overlapping/redundant work.

<SOW_1_METADATA>
Filename: {filename_1}
</SOW_1_METADATA>

<SOW_1_TEXT>
{sow_text_1}
</SOW_1_TEXT>

<SOW_2_METADATA>
Filename: {filename_2}
</SOW_2_METADATA>

<SOW_2_TEXT>
{sow_text_2}
</SOW_2_TEXT>

Analyze the tasks, deliverables, and scope of work in both SOWs.

Calculate the percentage of overlapping/redundant work between them. Consider:
- Similar tasks or deliverables described with different terminology
- Duplicate services or functions
- Common technical requirements
- Overlapping personnel roles or responsibilities

Return ONLY valid JSON (no additional text):

{{
  "overlap_percentage": 0-100,
  "explanation": "Brief 2-3 sentence summary of what work overlaps",
  "overlapping_areas": ["Area 1", "Area 2", "Area 3"],
  "confidence": "HIGH|MEDIUM|LOW"
}}

If there is minimal or no overlap (< 15%), set overlap_percentage to the actual low value and explain why.
"""


def extract_budget_from_text(text: str) -> Optional[float]:
    """
    Extract budget/contract value from SOW text using regex patterns

    Args:
        text: Full text of the SOW

    Returns:
        Budget value as float, or None if not found
    """
    # Common patterns for budget mentions in government contracts
    patterns = [
        r'contract\s+value[:\s]+\$?([\d,]+(?:\.\d{2})?)',
        r'total\s+contract\s+value[:\s]+\$?([\d,]+(?:\.\d{2})?)',
        r'not\s+to\s+exceed[:\s]+\$?([\d,]+(?:\.\d{2})?)',
        r'maximum\s+contract\s+value[:\s]+\$?([\d,]+(?:\.\d{2})?)',
        r'total\s+obligated\s+amount[:\s]+\$?([\d,]+(?:\.\d{2})?)',
        r'ceiling\s+price[:\s]+\$?([\d,]+(?:\.\d{2})?)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Remove commas and convert to float
            value_str = match.group(1).replace(',', '')
            try:
                return float(value_str)
            except ValueError:
                continue

    return None


def analyze_overlap(sow_data_list: List[Dict]) -> Dict:
    """
    Analyze overlap between multiple SOWs

    Args:
        sow_data_list: List of dictionaries, each containing:
            - filename: Name of the SOW file
            - raw_text: Full text content
            - extracted_data: Structured extraction from Pass 1

    Returns:
        Dictionary with overlap analysis results
    """
    if len(sow_data_list) < 2:
        return None

    # For MVP, we'll just compare the first two SOWs
    # Future: compare all pairs and create matrix
    sow1 = sow_data_list[0]
    sow2 = sow_data_list[1]

    print(f"\n[Overlap] Analyzing overlap between {sow1['filename']} and {sow2['filename']}...")

    # Prepare prompt
    prompt = OVERLAP_PROMPT.format(
        filename_1=sow1['filename'],
        sow_text_1=sow1['raw_text'][:15000],  # Limit to avoid token limits
        filename_2=sow2['filename'],
        sow_text_2=sow2['raw_text'][:15000]
    )

    try:
        # Call Claude for overlap analysis
        message = client.messages.create(
            model="claude-3-haiku-20240307",
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

        overlap_result = json.loads(json_text)

        # Extract budgets from both SOWs
        budget_1 = extract_budget_from_text(sow1['raw_text'])
        budget_2 = extract_budget_from_text(sow2['raw_text'])

        # Calculate redundant spend (use higher budget)
        max_budget = None
        if budget_1 and budget_2:
            max_budget = max(budget_1, budget_2)
        elif budget_1:
            max_budget = budget_1
        elif budget_2:
            max_budget = budget_2

        redundant_spend = None
        if max_budget:
            overlap_pct = overlap_result.get('overlap_percentage', 0) / 100
            redundant_spend = max_budget * overlap_pct

        # Add calculated fields
        overlap_result['sow_1_filename'] = sow1['filename']
        overlap_result['sow_2_filename'] = sow2['filename']
        overlap_result['budget_1'] = budget_1
        overlap_result['budget_2'] = budget_2
        overlap_result['max_budget'] = max_budget
        overlap_result['redundant_spend'] = redundant_spend

        print(f"[OK] Overlap analysis complete: {overlap_result['overlap_percentage']}% overlap")

        return overlap_result

    except Exception as e:
        print(f"[WARNING] Overlap analysis error: {e}")
        return {
            "overlap_percentage": 0,
            "explanation": f"Error during overlap analysis: {str(e)}",
            "overlapping_areas": [],
            "confidence": "LOW",
            "error": str(e)
        }


if __name__ == "__main__":
    # Test with sample data
    print("Overlap analyzer module loaded")
