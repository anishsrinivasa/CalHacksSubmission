'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ResultsDashboard from '@/components/ResultsDashboard';

export type AnalysisResult = {
  success: boolean;
  filename: string;
  contract_id?: string;
  contractor?: string;
  summary: {
    total_findings: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
    tasks_found: number;
    kpis_found: number;
    deliverables_found: number;
  };
  extracted_data: any;
  analysis: any;
};

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🔍 SOW Analyzer
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                AI-powered analysis of government contract Statements of Work
              </p>
            </div>
            {analysisResult && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Analyze Another
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!analysisResult && !isAnalyzing && (
          <FileUpload
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisStart={handleAnalysisStart}
          />
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
            <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">
              Analyzing SOW...
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This usually takes 1-2 minutes
            </p>
          </div>
        )}

        {analysisResult && (
          <ResultsDashboard result={analysisResult} onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Powered by Claude AI • Built to detect waste and improve government contracting
          </p>
        </div>
      </footer>
    </main>
  );
}
