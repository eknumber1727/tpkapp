import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Check for the specific Firebase API key error reported by the user
      const isApiKeyError = this.state.error?.message.includes('auth/api-key-not-valid');

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-sans">
          <div className="bg-white p-8 rounded-[30px] shadow-lg max-w-lg text-center w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
            <p className="text-[#2C3E50] mb-4">
              An unexpected error occurred, and the application could not start properly.
            </p>
            
            {isApiKeyError ? (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 text-left mb-4 rounded-r-lg">
                <p className="font-bold">Invalid API Key Detected</p>
                <p className="mt-2 text-sm">
                  The error message indicates that your Firebase API key is not valid. Please ensure that the <code>VITE_FIREBASE_API_KEY</code> in your project's environment configuration is correct and matches the one from your Firebase console.
                </p>
              </div>
            ) : (
               <div className="bg-gray-100 p-4 rounded-md text-left text-sm text-gray-600 overflow-auto max-h-40">
                  <p><strong>Error Details:</strong> {this.state.error?.message}</p>
               </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
