import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './App';

// Базовий заголовок вкладки задає <title> у public/index.html. Сторінки додають до
// нього свою назву через usePageTitle, з тією самою назвою сайту SITE_NAME.
// Не задавайте назву сайту тут: попередній варіант ставив стару «Nine or Ten».
ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <App />
    </StyledEngineProvider>
  </React.StrictMode>
);
