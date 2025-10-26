'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { AnalysisResult } from '@/app/page';

interface FileUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onAnalysisStart: () => void;
}

export default function FileUpload({ onAnalysisComplete, onAnalysisStart }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  }, []);

  const handleFileUpload = async (files: File[]) => {
    setError(null);

    // Validate file types
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    for (const file of files) {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        setError(`Unsupported file type: ${file.name}. Please upload ${allowedTypes.join(', ')} files.`);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }
    }

    onAnalysisStart();

    try {
      const formData = new FormData();
      // Append all files with the same field name
      files.forEach(file => {
        formData.append('files', file);
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await axios.post<AnalysisResult>(
        `${apiUrl}/api/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minute timeout for multiple files
        }
      );

      onAnalysisComplete(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errorMessage);
      onAnalysisStart(); // Reset loading state
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Card */}
      <div className="bg-govtech-card rounded-xl p-8 border border-govtech-border">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-govtech-text-primary tracking-tight">
            Upload Document
          </h2>
          <p className="mt-2 text-sm text-govtech-text-secondary">
            Supported formats: PDF, DOCX, TXT • Max 10MB • Upload 1-2 files for overlap detection
          </p>
        </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${isDragging
                ? 'border-govtech-primary bg-govtech-card'
                : 'border-govtech-border hover:border-govtech-primary'
              }
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={handleFileSelect}
            />

            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-govtech-text-secondary mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <span className="text-base font-semibold text-govtech-text-primary mb-1">
                {isDragging ? 'Drop file here' : 'Drag and drop your SOW file'}
              </span>

              <span className="text-sm text-govtech-text-secondary mb-5">
                or click to browse
              </span>

              <label
                htmlFor="file-upload"
                className="cursor-pointer px-6 h-10 bg-govtech-primary text-black font-medium rounded-lg hover:bg-govtech-primary-hover transition-all text-sm flex items-center justify-center"
              >
                Select File
              </label>
            </div>
          </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
