import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/shared/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DataProvider>
        <App />
      </DataProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
