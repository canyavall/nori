import { contextBridge } from 'electron';

// Declare location as it exists in preload context
declare const location: { search: string };

// Get port from URL query parameter (passed by main process)
const urlParams = new URLSearchParams(location.search);
const serverPort = urlParams.get('port') || '3000';

// Expose safe API to renderer
contextBridge.exposeInMainWorld('nori', {
  serverPort: parseInt(serverPort, 10),
  env: {
    isDevelopment: process.env.NODE_ENV === 'development'
  }
});

// Type definitions for renderer (will be used in renderer code)
export interface NoriAPI {
  serverPort: number;
  env: {
    isDevelopment: boolean;
  };
}

declare global {
  interface Window {
    nori: NoriAPI;
  }
}
