/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Foren API. Unused while services run on mocks (see src/services/README.md). */
  readonly VITE_API_BASE_URL?: string;
  /** "true" to use the mock services (default), "false" to call the real API. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
