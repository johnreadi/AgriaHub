import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <React.StrictMode>
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold">AgriaHub Frontend</h1>
      </div>
    </React.StrictMode>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}
