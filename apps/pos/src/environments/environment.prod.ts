export const environment = {
  production: true,
  MEDUSA_PUBLISHABLE_KEY: "pk_7874e153319334c3a8207a59a3e3dbc23bd698e15ab3425671bdae34b4fb51da",
  MEDUSA_API_BASE_PATH: "http://localhost:9000",
  MEDUSA_BACKEND_URL: "http://localhost:9000",
  apiUrl: "http://localhost:9000",
  STRIPE_PUBLISHABLE_KEY: "",
  errorLogging: {
    enabled: false,
    maxSize: 100,
    logStackTraces: false,
    minSeverity: 'high' as const,
  },
  debugLogging: {
    enabled: false,
    maxSize: 250,
    echoToConsole: false,
    networkTracing: false,
  },
};
