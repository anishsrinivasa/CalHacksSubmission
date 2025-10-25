"""
Pass 2: Risk Analysis - Identify issues within a single SOW
"""
import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ANALYSIS_PROMPT = """You are a government procurement analyst reviewing a contract SOW for risks and weaknesses.

Review the extracted SOW data below:

<sow_data>
{sow_data}
</sow_data>

Analyze for the following issues:

1. WEAK OR UNMEASURABLE KPIs
Check each KPI/performance metric for:
- ❌ Missing baseline (e.g., "improve satisfaction" but no current score)
- ❌ Missing target (e.g., "increase uptime" but no percentage goal)
- ❌ Missing timeframe (e.g., "reduce wait times" but no deadline)
- ❌ Missing measurement method (e.g., "improve satisfaction" but no survey/tool specified)
- ❌ Vague language (e.g., "enhance", "improve", "optimize", "target levels", "acceptable", "reasonable" without specifics)

For each weak KPI:
- Severity: HIGH (completely unmeasurable) / MEDIUM (partially measurable) / LOW (minor gaps)
- What's missing (baseline, target, timeframe, method)
- Risk to contract oversight

2. SCOPE CREEP LANGUAGE
Flag phrases in task descriptions that create open-ended obligations:
- "ongoing support", "as needed", "as required", "as directed"
- "reasonable effort", "best effort", "appropriate support", "reasonable assistance"
- "and related tasks", "other duties", "etc.", "including but not limited to"
- "assist with", "support", "help" (without specific scope)
- "improve", "optimize", "enhance" without specific targets or limits

For each instance:
- Exact quote + location (task ID)
- Why it's problematic
- Estimated financial risk (e.g., could lead to unbounded billing)

3. MISSING CRITICAL ELEMENTS
Check if SOW is missing:
- Acceptance criteria (how will deliverables be approved/rejected?)
- Assumptions (what conditions must be true for success?)
- Roles and responsibilities (who does what - contractor vs government)
- Government furnished resources (is it clear what gov provides?)
- Out-of-scope statement (what contractor is NOT responsible for)
- Progress reporting requirements
- Contractor project manager designation

4. INTERNAL INCONSISTENCIES
Cross-check within the same document:
- Do all objectives have corresponding tasks/deliverables?
- Do all deliverables tie back to an objective or task?
- Are deliverables clearly defined or just vague outputs?
- Are due dates realistic based on dependencies?
- Do reporting requirements specify frequency and format?

5. DELIVERABLE QUALITY ISSUES
Flag deliverables that are:
- Too vague (e.g., "provide support" vs "submit monthly status report")
- Missing format/content requirements
- Missing due dates or milestones
- Missing acceptance criteria

6. COMMON RED FLAGS IN GOVERNMENT CONTRACTS
- Task 0 (Project Management) missing or weak
- No final report requirement
- No kick-off meeting requirement
- Progress reports not specified (should be quarterly minimum)
- No key personnel identified
- Security/clearance requirements unclear

For each finding, BE CONCISE. Keep descriptions to 1-2 sentences maximum.

IMPORTANT JSON RULES:
1. Use ONLY straight ASCII quotes (") for JSON structure
2. When quoting text WITHIN a string value, use SINGLE quotes (') not double quotes
3. Example: "issue": "The KPI lacks a 'specific target' and 'measurement method'"
4. NEVER use nested double quotes like "issue": "lacks "target"" - this breaks JSON

Return ONLY valid JSON with no additional text. Use this structure:

{
  "weak_kpis": [
    {
      "text": "string",
      "location": "string",
      "severity": "HIGH/MEDIUM/LOW",
      "missing": ["baseline/target/timeframe/method"],
      "issue": "1-2 sentence summary"
    }
  ],
  "scope_creep": [
    {
      "text": "string",
      "location": "string",
      "severity": "HIGH/MEDIUM/LOW",
      "issue": "1-2 sentence summary"
    }
  ],
  "missing_elements": [
    {
      "element": "string",
      "severity": "HIGH/MEDIUM/LOW"
    }
  ],
  "inconsistencies": [
    {
      "type": "string",
      "severity": "HIGH/MEDIUM/LOW",
      "issue": "1-2 sentence summary"
    }
  ],
  "deliverable_issues": [
    {
      "name": "string",
      "location": "string",
      "severity": "HIGH/MEDIUM/LOW",
      "issue": "1-2 sentence summary"
    }
  ],
  "red_flags": [
    {
      "flag": "string",
      "severity": "HIGH/MEDIUM/LOW"
    }
  ]
}"""


def analyze_sow(extracted_data: dict, model: str = "claude-3-haiku-20240307") -> dict:
    """
    Analyze extracted SOW data for risks and weaknesses

    Args:
        extracted_data: Dictionary from Pass 1 (sow_extractor.py)
        model: Claude model to use

    Returns:
        Dictionary with risk findings
    """
    # Convert extracted data to JSON string for prompt
    sow_data_str = json.dumps(extracted_data, indent=2)
    prompt = ANALYSIS_PROMPT.replace("{sow_data}", sow_data_str)

    print(f"Analyzing SOW for risks...")
    print(f"Contract: {extracted_data.get('metadata', {}).get('contract_id', 'Unknown')}")

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

    # Fix curly quotes (convert to straight quotes for JSON compatibility)
    response_bytes = response_text.encode('utf-8')
    response_bytes = response_bytes.replace(b'\xe2\x80\x9c', b'"')  # "
    response_bytes = response_bytes.replace(b'\xe2\x80\x9d', b'"')  # "
    response_bytes = response_bytes.replace(b'\xe2\x80\x98', b"'")  # '
    response_bytes = response_bytes.replace(b'\xe2\x80\x99', b"'")  # '
    response_text = response_bytes.decode('utf-8')

    # Extract JSON from response (in case there's extra text)
    json_start = response_text.find('{')
    json_end = response_text.rfind('}') + 1
    if json_start != -1 and json_end > json_start:
        json_text = response_text[json_start:json_end]
    else:
        json_text = response_text

    # Parse JSON response
    try:
        analysis = json.loads(json_text)
        print(f"✓ Analysis complete")
        return analysis
    except json.JSONDecodeError as e:
        print(f"✗ JSON parsing failed: {e}")
        print(f"Hint: Check if Claude used nested quotes in text values")
        raise


def analyze_from_file(extracted_json_path: str) -> dict:
    """
    Analyze SOW from extracted JSON file

    Args:
        extracted_json_path: Path to JSON file from Pass 1

    Returns:
        Dictionary with risk findings
    """
    print(f"\nLoading extracted data: {extracted_json_path}")

    with open(extracted_json_path, 'r', encoding='utf-8') as f:
        extracted_data = json.load(f)

    return analyze_sow(extracted_data)


def print_summary(analysis: dict):
    """Print a readable summary of findings"""
    print("\n" + "="*70)
    print("RISK ANALYSIS SUMMARY")
    print("="*70)

    # Count by severity
    all_findings = []
    for category in ['weak_kpis', 'scope_creep', 'missing_elements',
                     'inconsistencies', 'deliverable_issues', 'red_flags']:
        findings = analysis.get(category, [])
        all_findings.extend(findings)

    high = sum(1 for f in all_findings if f.get('severity') == 'HIGH')
    medium = sum(1 for f in all_findings if f.get('severity') == 'MEDIUM')
    low = sum(1 for f in all_findings if f.get('severity') == 'LOW')

    print(f"\n📊 Total Findings: {len(all_findings)}")
    print(f"   🔴 HIGH:   {high}")
    print(f"   🟡 MEDIUM: {medium}")
    print(f"   🟢 LOW:    {low}")

    # Weak KPIs
    weak_kpis = analysis.get('weak_kpis', [])
    if weak_kpis:
        print(f"\n⚠️  WEAK KPIs ({len(weak_kpis)} found):")
        for kpi in weak_kpis[:3]:  # Show first 3
            text = kpi.get('text', kpi.get('kpi_text', ''))[:60]
            print(f"   • [{kpi['severity']}] {text}...")
            print(f"     Missing: {', '.join(kpi.get('missing', []))}")

    # Scope Creep
    scope_creep = analysis.get('scope_creep', [])
    if scope_creep:
        print(f"\n⚠️  SCOPE CREEP LANGUAGE ({len(scope_creep)} found):")
        for sc in scope_creep[:3]:  # Show first 3
            print(f"   • [{sc['severity']}] \"{sc['text'][:50]}...\" ({sc['location']})")

    # Missing Elements
    missing = analysis.get('missing_elements', [])
    if missing:
        print(f"\n⚠️  MISSING ELEMENTS ({len(missing)} found):")
        for elem in missing[:3]:
            print(f"   • [{elem['severity']}] {elem['element']}")

    # Red Flags
    red_flags = analysis.get('red_flags', [])
    if red_flags:
        print(f"\n🚩 RED FLAGS ({len(red_flags)} found):")
        for flag in red_flags[:3]:
            print(f"   • [{flag['severity']}] {flag['flag']}")

    print("\n" + "="*70)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python risk_analyzer.py <extracted_json_path>")
        print("Example: python risk_analyzer.py sample_nyserda_sow_extracted.json")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)

    # Analyze
    analysis = analyze_from_file(input_file)

    # Save results
    output_file = input_file.replace('_extracted.json', '_analysis.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Analysis saved to: {output_file}")

    # Print summary
    print_summary(analysis)
