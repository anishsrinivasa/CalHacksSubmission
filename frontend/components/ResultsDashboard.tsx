'use client';

import type { AnalysisResult } from '@/app/page';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const { summary, analysis, extracted_data, overlap_analysis } = result;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header - Borderless & Sleek */}
      <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-govtech-text-primary">
              Analysis Results
            </h2>
            <p className="mt-1 text-sm text-govtech-text-secondary">
              Contract: {result.contract_id || result.filename}
            </p>
            {result.contractor && (
              <p className="mt-0.5 text-sm text-govtech-text-secondary">
                Contractor: {result.contractor}
              </p>
            )}
          </div>
          <div className="text-right bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3">
            <div className="text-3xl font-bold text-red-400">
              {summary.total_findings}
            </div>
            <div className="text-xs text-red-400 font-semibold">
              Issues Found
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Borderless & Unified */}
      <div className={`grid grid-cols-1 gap-4 ${overlap_analysis ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        {/* High Severity */}
        <div className="bg-govtech-card rounded-xl p-5 border border-govtech-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-govtech-text-secondary">
                High Severity
              </p>
              <p className="mt-2 text-2xl font-bold text-govtech-text-primary">
                {summary.high_severity}
              </p>
            </div>
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Medium Severity */}
        <div className="bg-govtech-card rounded-xl p-5 border border-govtech-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-govtech-text-secondary">
                Medium Severity
              </p>
              <p className="mt-2 text-2xl font-bold text-govtech-text-primary">
                {summary.medium_severity}
              </p>
            </div>
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Low Severity */}
        <div className="bg-govtech-card rounded-xl p-5 border border-govtech-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-govtech-text-secondary">
                Low Severity
              </p>
              <p className="mt-2 text-2xl font-bold text-govtech-text-primary">
                {summary.low_severity}
              </p>
            </div>
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Contract Stats */}
        <div className="bg-govtech-card rounded-xl p-5 border border-govtech-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-govtech-text-secondary">
                Tasks Found
              </p>
              <p className="mt-2 text-2xl font-bold text-govtech-text-primary">
                {summary.tasks_found}
              </p>
            </div>
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        {/* Overlap Percentage - Only show if overlap analysis exists */}
        {overlap_analysis && (
          <div className="bg-govtech-card rounded-xl p-5 border border-govtech-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-govtech-text-secondary">
                  Overlap
                </p>
                <p className="mt-2 text-2xl font-bold text-govtech-text-primary">
                  {overlap_analysis.overlap_percentage}%
                </p>
              </div>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Weak KPIs - Borderless */}
      {analysis.weak_kpis && analysis.weak_kpis.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-govtech-text-primary tracking-tight">
              Weak KPIs ({analysis.weak_kpis.length})
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.weak_kpis.map((kpi: any, index: number) => (
              <div key={index} className="bg-govtech-card border border-govtech-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getSeverityColor(kpi.severity)}`}>
                    {kpi.severity}
                  </span>
                </div>
                <p className="font-semibold text-govtech-text-primary mb-2 text-sm">
                  {kpi.text}
                </p>
                <p className="text-sm text-govtech-text-secondary mb-2">
                  {kpi.issue || kpi.explanation}
                </p>
                {kpi.missing && kpi.missing.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs font-semibold text-govtech-text-secondary">Missing:</span>
                    {kpi.missing.map((item: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-gray-700/50 text-gray-300 rounded-md">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {kpi.remediation && (
                  <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs font-semibold text-govtech-text-primary mb-1">How to fix:</p>
                    <p className="text-xs text-govtech-text-secondary">{kpi.remediation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scope Creep - Borderless */}
      {analysis.scope_creep && analysis.scope_creep.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-govtech-text-primary tracking-tight">
              Scope Creep Warnings ({analysis.scope_creep.length})
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.scope_creep.map((item: any, index: number) => (
              <div key={index} className="bg-govtech-card border border-govtech-border rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-sm font-mono bg-gray-900/50 p-3 rounded-lg text-govtech-text-primary mb-3">
                  "{item.text || item.problematic_text}"
                </p>
                <p className="text-sm text-govtech-text-secondary">
                  {item.issue || item.explanation}
                </p>
                {item.remediation && (
                  <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs font-semibold text-govtech-text-primary mb-1">How to fix:</p>
                    <p className="text-xs text-govtech-text-secondary">{item.remediation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Elements - Borderless */}
      {analysis.missing_elements && analysis.missing_elements.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-govtech-text-primary tracking-tight">
              Missing Elements ({analysis.missing_elements.length})
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.missing_elements.map((item: any, index: number) => (
              <div key={index} className="bg-govtech-card border border-govtech-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-sm font-mono bg-gray-900/50 p-3 rounded-lg text-govtech-text-primary mb-3">
                  "{item.text || item.element || item.problematic_text}"
                </p>
                <p className="text-sm text-govtech-text-secondary">
                  {item.issue || item.explanation}
                </p>
                {item.remediation && (
                  <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs font-semibold text-govtech-text-primary mb-1">How to fix:</p>
                    <p className="text-xs text-govtech-text-secondary">{item.remediation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags - Borderless */}
      {analysis.red_flags && analysis.red_flags.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-govtech-text-primary tracking-tight">
              Red Flags ({analysis.red_flags.length})
            </h3>
          </div>
          <div className="space-y-2">
            {analysis.red_flags.map((flag: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-govtech-card border border-govtech-border rounded-lg p-5">
                <span className="text-govtech-text-primary text-sm font-medium">
                  {flag.flag}
                </span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getSeverityColor(flag.severity)}`}>
                  {flag.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlap Analysis Section */}
      {overlap_analysis && (
        <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-govtech-text-primary tracking-tight">
              Contract Overlap Analysis
            </h3>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            {/* Overlap Percentage with Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-govtech-text-secondary">
                  Overlap Detected
                </span>
                <span className="text-2xl font-bold text-govtech-text-primary">
                  {overlap_analysis.overlap_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${overlap_analysis.overlap_percentage}%` }}
                />
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-govtech-text-secondary mb-2">
                Analysis Summary
              </h4>
              <p className="text-sm text-govtech-text-primary leading-relaxed">
                {overlap_analysis.explanation}
              </p>
            </div>

            {/* Overlapping Areas */}
            {overlap_analysis.overlapping_areas && overlap_analysis.overlapping_areas.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-govtech-text-secondary mb-3">
                  Overlapping Areas
                </h4>
                <div className="space-y-2">
                  {overlap_analysis.overlapping_areas.map((area: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-govtech-text-primary">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Impact */}
            {overlap_analysis.redundant_spend !== null && overlap_analysis.redundant_spend !== undefined && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-red-300 mb-1">
                      Estimated Redundant Spend
                    </h4>
                    <p className="text-2xl font-bold text-red-400">
                      ${overlap_analysis.redundant_spend.toLocaleString()}
                    </p>
                    <p className="text-xs text-red-300 mt-1">
                      Based on {overlap_analysis.overlap_percentage}% overlap of ${overlap_analysis.max_budget?.toLocaleString()} maximum contract value
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confidence Level */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-govtech-text-secondary">
                Confidence Level:
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                overlap_analysis.confidence === 'HIGH'
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : overlap_analysis.confidence === 'MEDIUM'
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
              }`}>
                {overlap_analysis.confidence}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Download Button - White with Black Text */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(result, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `${result.contract_id || 'analysis'}_results.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
          className="px-6 h-10 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-all text-sm"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Results (JSON)
          </div>
        </button>
      </div>
    </div>
  );
}
