/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly REACT_APP_API_URL?: string;
  readonly REACT_APP_CLUB_ID?: string;
  readonly REACT_APP_GOOGLE_CLIENT_ID?: string;
  readonly REACT_APP_OBS_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
