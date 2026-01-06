import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, ServerInstance } from '../server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serverInstance: ServerInstance | null = null;

async function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL(`http://localhost:5173?port=${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    await mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startApp() {
  try {
    // Start Express server
    console.log('[Main] Starting Express server...');
    serverInstance = await createServer();
    console.log(`[Main] Server started on port ${serverInstance.port}`);

    // Create Electron window
    console.log('[Main] Creating window...');
    await createWindow(serverInstance.port);
  } catch (err) {
    console.error('[Main] Failed to start app:', err);
    app.quit();
  }
}

// App lifecycle
app.whenReady().then(startApp);

app.on('window-all-closed', async () => {
  // Graceful shutdown
  if (serverInstance) {
    console.log('[Main] Shutting down server...');
    try {
      await serverInstance.close();
    } catch (err) {
      console.error('[Main] Error during server shutdown:', err);
    }
  }

  // On macOS, keep app running when windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Recreate window on macOS when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0 && serverInstance) {
    createWindow(serverInstance.port);
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('[Main] Received SIGINT, shutting down...');
  if (serverInstance) {
    await serverInstance.close();
  }
  app.quit();
});

process.on('SIGTERM', async () => {
  console.log('[Main] Received SIGTERM, shutting down...');
  if (serverInstance) {
    await serverInstance.close();
  }
  app.quit();
});
