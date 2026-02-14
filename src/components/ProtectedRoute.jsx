import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SetupForm from './SetupForm';
import LoginForm from './LoginForm';
import Onboarding from './Onboarding';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { IS_PLATFORM } from '../constants/config';

const LoadingScreen = ({ error, onRetry }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <MessageSquare className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Claude Code UI</h1>
      {error ? (
        <>
          <p className="text-red-500 mt-2 mb-4 text-sm">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Retry / 重试
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </>
      )}
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, isLoading, needsSetup, hasCompletedOnboarding, refreshOnboardingStatus, error } = useAuth();

  const handleRetry = () => {
    window.location.reload();
  };

  if (IS_PLATFORM) {
    if (isLoading) {
      return <LoadingScreen />;
    }

    if (!hasCompletedOnboarding) {
      return <Onboarding onComplete={refreshOnboardingStatus} />;
    }

    return children;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error with retry button if auth check failed but not loading
  if (error && !user && !needsSetup) {
    return <LoadingScreen error={error} onRetry={handleRetry} />;
  }

  if (needsSetup) {
    return <SetupForm />;
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={refreshOnboardingStatus} />;
  }

  return children;
};

export default ProtectedRoute;