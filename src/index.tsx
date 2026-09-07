import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './App';

// Заголовок вкладки задає <title> у public/index.html. Не перезаписуйте його
// звідси: попередній варіант ставив стару назву «Nine or Ten» після монтування.
ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
  </React.StrictMode>
);
