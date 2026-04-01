const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const APP_URL = process.env.COMMAND_CENTER_URL || 'https://command-web-549189599662.asia-northeast3.run.app';

// OAuth/auth domains that should stay inside the app
const AUTH_DOMAINS = [
  'accounts.google.com',
  'supabase.co',
];

function isAuthUrl(url) {
  try {
    const { hostname } = new URL(url);
    return AUTH_DOMAINS.some(domain => hostname.endsWith(domain));
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

  // OAuth URLs stay in-app, other external links open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL) || isAuthUrl(url)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation redirects (OAuth callback)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow app URL and auth URLs
    if (url.startsWith(APP_URL) || isAuthUrl(url)) {
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
