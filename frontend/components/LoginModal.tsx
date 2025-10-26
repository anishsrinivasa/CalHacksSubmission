'use client';

import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const VALID_USERNAME = 'CalHacksGovTech';
  const VALID_PASSWORD = 'CalWinner1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      // Successful login
      sessionStorage.setItem('isLoggedIn', 'true');
      onLogin();
      onClose();
    } else {
      // Failed login
      setError('Incorrect username or password. Only government authorized users may use this service.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-govtech-card border border-govtech-border rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Close Button - X in Circle */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-govtech-text-primary mb-2">
          Sign In
        </h2>
        <p className="text-sm text-govtech-text-secondary mb-6">
          Government authorized access only
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-govtech-text-primary mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-govtech-text-primary placeholder-gray-500 focus:outline-none focus:border-govtech-primary transition-colors"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-govtech-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-govtech-text-primary placeholder-gray-500 focus:outline-none focus:border-govtech-primary transition-colors"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-6 py-2.5 bg-govtech-primary text-black font-medium rounded-lg hover:bg-govtech-primary-hover transition-all"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
