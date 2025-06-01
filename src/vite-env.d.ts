/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // आप अपने अन्य Vite एनवायरनमेंट वेरिएबल्स को यहाँ जोड़ सकते हैं, यदि कोई हो।
  // उदाहरण: readonly VITE_ANOTHER_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}