import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>  {/* among other things, this makes components render twice in dev */}
      <div>Hello World</div>
  </React.StrictMode>
)