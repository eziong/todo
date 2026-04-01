const { app, BrowserWindow, shell, globalShortcut } = require('electron');
const path = require('path');

const APP_URL = process.env.COMMAND_CENTER_URL || 'https://command-web-549189599662.asia-northeast3.run.app';

// Domains that should stay inside the Electron window
const ALLOWED_DOMAINS = [
  'accounts.google.com',
  'supabase.co',
  'googleapis.com',
  'google.com',
  'gstatic.com',
];

function isAllowedUrl(url) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(APP_URL);

  // F12 opens DevTools for debugging
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Log all navigations for debugging
  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('[NAV]', url);
  });

  mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
    console.log('[NAV-INPAGE]', url);
  });

  // OAuth/allowed URLs stay in-app, other external links open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL) || isAllowedUrl(url)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle in-page navigation — allow app + auth URLs, block others
  mainWindow.webContents.on('will-navigate', (event, url) => {
    console.log('[WILL-NAV]', url);
    if (url.startsWith(APP_URL) || isAllowedUrl(url)) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
