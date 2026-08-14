import React from'react';
import{createRoot}from'react-dom/client';
import App from'./app/App';
import{AppErrorBoundary}from'./core/errors/AppErrorBoundary';
import'./design/index.css';
import'./design/features/welcome/luxury.css';

createRoot(document.getElementById('root')!).render(<AppErrorBoundary><App/></AppErrorBoundary>);
