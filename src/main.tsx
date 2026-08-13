import React from'react';
import{createRoot}from'react-dom/client';
import App from'./app/App';
import{AppErrorBoundary}from'./core/errors/AppErrorBoundary';
import'./design/index.css';
import'./design/features/welcome/background.css';
import'./design/features/welcome/slab.css';
import'./design/features/welcome/spark-orb.css';
import'./design/features/welcome/message.css';
import'./design/features/welcome/message-finish.css';
import'./design/features/welcome/button-stack.css';
import'./design/features/welcome/button-surface.css';
import'./design/features/welcome/compat.css';
import'./design/features/welcome/responsive.css';

createRoot(document.getElementById('root')!).render(<AppErrorBoundary><App/></AppErrorBoundary>);
