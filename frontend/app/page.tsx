'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FileUpload from '@/components/FileUpload';
import ResultsDashboard from '@/components/ResultsDashboard';
import LoginModal from '@/components/LoginModal';

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
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const tasks = [
    'Extracting data',
    'Analyzing KPIs',
    'Detecting issues'
  ];

  // Check sessionStorage on mount to restore login state
  useEffect(() => {
    const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      // Cycle through tasks
      const taskInterval = setInterval(() => {
        setCurrentTaskIndex((prev) => (prev + 1) % tasks.length);
      }, 2000); // Change task every 2 seconds

      // Animate progress bar
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev; // Cap at 95% until complete
          return prev + 1;
        });
      }, 500); // Increase progress every 500ms

      return () => {
        clearInterval(taskInterval);
        clearInterval(progressInterval);
      };
    } else {
      // Reset when not analyzing
      setCurrentTaskIndex(0);
      setProgress(0);
    }
  }, [isAnalyzing]);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setProgress(100); // Complete the progress bar
    setTimeout(() => {
      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 300);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCurrentTaskIndex(0);
    setProgress(0);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setCurrentTaskIndex(0);
    setProgress(0);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-govtech-bg">
      {/* Header - Sticky with Navigation */}
      <header className="sticky top-0 z-50 bg-govtech-bg/95 backdrop-blur-sm border-b border-govtech-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="Scope.ai Logo"
                  width={32}
                  height={32}
                />
                <h1 className="text-xl font-semibold text-govtech-text-primary tracking-tight">
                  Scope.ai
                </h1>
              </div>

              {!analysisResult && !isAnalyzing && (
                <nav className="hidden md:flex items-center gap-6">
                  <button
                    onClick={() => scrollToSection('target')}
                    className="text-sm text-govtech-text-secondary hover:text-govtech-text-primary transition-colors focus:outline-none focus-visible:outline-none active:outline-none"
                  >
                    Target
                  </button>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-govtech-text-secondary hover:text-govtech-text-primary transition-colors focus:outline-none focus-visible:outline-none active:outline-none"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection('efficiency')}
                    className="text-sm text-govtech-text-secondary hover:text-govtech-text-primary transition-colors focus:outline-none focus-visible:outline-none active:outline-none"
                  >
                    Efficiency
                  </button>
                </nav>
              )}
            </div>

            {analysisResult && (
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-sm font-medium text-black bg-govtech-primary hover:bg-govtech-primary-hover transition-all rounded-lg h-10 focus:outline-none"
              >
                New Analysis
              </button>
            )}

            {!isLoggedIn && !analysisResult && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-5 py-2.5 text-sm font-medium text-black bg-govtech-primary hover:bg-govtech-primary-hover transition-all rounded-lg h-10 focus:outline-none"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      {!analysisResult && !isAnalyzing && (
        <div className="bg-govtech-card border-b border-govtech-border">
          <div className="max-w-7xl mx-auto px-8 py-12 text-center">
            <h2 className="text-4xl md:text-5xl font-semibold text-govtech-text-primary tracking-tight max-w-3xl mx-auto leading-[1.1]">
              Detect overlapping tasks and discrepencies in government contracts
            </h2>
            <p className="mt-4 text-lg text-govtech-text-secondary max-w-2xl mx-auto">
              Securely upload your Statement of Work (SOW) and get an AI-powered analysis to identify weak KPIs, scope creep, and more.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div id="upload" className="max-w-7xl mx-auto px-8 py-12">
        {!analysisResult && !isAnalyzing && isLoggedIn && (
          <FileUpload
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisStart={handleAnalysisStart}
          />
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-govtech-primary"></div>
            <p className="mt-6 text-lg font-semibold text-govtech-text-primary">
              Analyzing your contract...
            </p>
            <p className="mt-2 text-sm text-govtech-text-secondary">
              Running AI analysis • Usually takes 1-2 minutes
            </p>

            {/* Progress Bar */}
            <div className="mt-8 w-full max-w-md">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Task - Cycling */}
            <div className="mt-6 flex items-center gap-2 text-sm text-govtech-text-muted">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span key={currentTaskIndex} className="animate-fade-in">
                {tasks[currentTaskIndex]}
              </span>
            </div>
          </div>
        )}

        {analysisResult && (
          <ResultsDashboard result={analysisResult} onReset={handleReset} />
        )}
      </div>

      {/* Landing Page Sections - Only show when no analysis */}
      {!analysisResult && !isAnalyzing && (
        <>
          {/* Who Can Use It Section */}
          <div id="target" className="border-y border-govtech-border">
            <div className="max-w-7xl mx-auto px-8 py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-govtech-text-primary tracking-tight">
                  Which One Are You?
                </h2>
                <p className="mt-3 text-govtech-text-secondary max-w-2xl mx-auto">
                  Made to speed-up contract review for teams across federal, state, and local agencies, as well as individuals
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Administrators */}
                <div className="bg-govtech-card rounded-xl p-8 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-govtech-text-primary mb-3">Contract Administrators</h3>
                  <p className="text-govtech-text-secondary mb-4">
                    Quickly validate SOWs before approval, catch compliance issues early, and eliminate the need for contract amendment
                  </p>
                  <ul className="space-y-2 text-sm text-govtech-text-secondary">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Pre-approval compliance checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Automated risk flagging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Faster approval workflows</span>
                    </li>
                  </ul>
                </div>

                {/* Analysts */}
                <div className="bg-govtech-card rounded-xl p-8 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-govtech-text-primary mb-3">Contract Analysts</h3>
                  <p className="text-govtech-text-secondary mb-4">
                    Speed-up your analysis with precise AI-powered suggestions and cover more contracts in less time.
                  </p>
                  <ul className="space-y-2 text-sm text-govtech-text-secondary">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Deeper KPI analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Pattern detection across contracts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Consistent quality standards</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features Section */}
          <div id="features" className="border-y border-govtech-border">
            <div className="max-w-7xl mx-auto px-8 py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-govtech-text-primary tracking-tight">
                  Comprehensive Contract Analysis
                </h2>
                <p className="mt-3 text-govtech-text-secondary max-w-2xl mx-auto">
                  Our AI identifies critical issues that lead to cost overruns, delays, and compliance problems
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="font-semibold text-govtech-text-primary mb-2">Weak KPI Detection</h3>
                  <p className="text-sm text-govtech-text-secondary">
                    Identifies vague performance metrics lacking measurable targets, baselines, or clear measurement methods that lead to accountability gaps
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-amber-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="font-semibold text-govtech-text-primary mb-2">Scope Creep Prevention</h3>
                  <p className="text-sm text-govtech-text-secondary">
                    Flags open-ended language like "as needed" or "reasonable effort" that create unlimited scope and budget exposure
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-govtech-text-primary mb-2">Missing Elements</h3>
                  <p className="text-sm text-govtech-text-secondary">
                    Detects absent critical components including acceptance criteria, assumptions, roles, responsibilities, and reporting requirements
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-rose-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <h3 className="font-semibold text-govtech-text-primary mb-2">Contract Red Flags</h3>
                  <p className="text-sm text-govtech-text-secondary">
                    Highlights violations of government contracting best practices and potential risk factors that could trigger disputes
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-govtech-text-primary mb-2">Timeline Validation</h3>
                  <p className="text-sm text-govtech-text-secondary">
                    Checks for unrealistic deadlines and misaligned objectives with delivery schedules that create execution risk
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="bg-govtech-card rounded-xl p-6 border border-govtech-border hover:shadow-md hover:shadow-white/5 transition-shadow">
                  <svg className="w-8 h-8 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-govtech-text-primary mb-2">Quality Standards</h3>
                  <p className="text-sm text-govtech-text-secondary">
                    Ensures deliverables have clear descriptions, formats, due dates, and acceptance standards to prevent ambiguity
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition / Stats Section */}
          <div id="efficiency" className="border-y border-govtech-border">
            <div className="max-w-7xl mx-auto px-8 py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-govtech-text-primary tracking-tight">
                  Reduce Costs, Increase Efficiency
                </h2>
                <p className="mt-3 text-govtech-text-secondary max-w-2xl mx-auto">
                  Government agencies spend billions annually on contract analysis. Our AI delivers instant results at a fraction of the cost.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {/* Stat 1 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-govtech-primary mb-2">$9.8B</div>
                  <div className="text-sm text-govtech-text-secondary">Annual federal spending on SOW analysis & contract review</div>
                </div>

                {/* Stat 2 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-govtech-primary mb-2">50,000+</div>
                  <div className="text-sm text-govtech-text-secondary">Contract analysts employed across federal agencies</div>
                </div>

                {/* Stat 3 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-govtech-primary mb-2">99.8%</div>
                  <div className="text-sm text-govtech-text-secondary">Cost reduction vs. paying analyst for overlapping and redundant work</div>
                </div>
              </div>

              {/* Value Add Details */}
              <div className="bg-govtech-card rounded-xl p-8 border border-govtech-border max-w-3xl mx-auto">
                <h3 className="text-xl font-semibold text-govtech-text-primary mb-4 text-center">How We Save You Money</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-govtech-text-primary">Instant Analysis vs. Days of Manual Review</p>
                      <p className="text-sm text-govtech-text-secondary mt-1">Our AI completes comprehensive SOW analysis in 1-2 minutes. Traditional analyst review takes 4-8 hours per contract.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-govtech-text-primary">Catch Issues Early, Prevent Costly Amendments</p>
                      <p className="text-sm text-govtech-text-secondary mt-1">Identifying weak KPIs and scope creep before contract execution saves an average of $150K per contract in amendment costs.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-govtech-text-primary">Zero Human Error, Consistent Quality</p>
                      <p className="text-sm text-govtech-text-secondary mt-1">Eliminate oversight from fatigue, bias, or varying expertise levels. Every contract gets the same thorough, systematic review.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-govtech-text-primary">Save Time, Cover More Ground</p>
                      <p className="text-sm text-govtech-text-secondary mt-1">Analysts will be able to review more contracts and avoid being assigned overlapping or redundent work.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setIsLoggedIn(true)}
        />
      )}
    </main>
  );
}
