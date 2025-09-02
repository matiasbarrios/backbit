// Requirements
import { join } from 'node:path';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
// eslint-disable-next-line import/no-unresolved
import icon from '../../resources/icon.png?asset';
import { settingsRead, settingsWrite } from './api/settings.js';
import { historyRead, historyWrite } from './api/history.js';
import { analysisRun } from './api/analysis.js';
import { backupRun } from './api/backup.js';
import { folderPick, folderRevealInOrigin } from './api/folders.js';


// Variables
let mainWindow;

const analysisToken = { cancelled: false };

const backupToken = { cancelled: false };


// Internal
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1230,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
        title: 'BackBit',
        icon,
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('preload-error', (_event, path, error) => {
        console.error('Preload failed:', path, error);
    });

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Open DevTools in development
    if (is.dev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}


// Main
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.backbit.backbit');

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    // Create the main window
    createWindow();

    // Handlers

    // Settings
    ipcMain.handle('settings-read', settingsRead);

    ipcMain.handle('settings-write', async (_evt, s) => {
        await settingsWrite(s);
    });

    // History
    ipcMain.handle('history-read', historyRead);

    ipcMain.handle('history-write', async (_evt, h) => {
        await historyWrite(h);
    });

    // Folders
    ipcMain.handle('folder-pick', folderPick(mainWindow));

    ipcMain.handle('folder-reveal-in-origin', async (_evt, { source, relativePath }) => {
        await folderRevealInOrigin(source, relativePath);
    });

    // Analysis
    ipcMain.handle('analysis-start', async (_evt, { source, destination }) => {
        analysisToken.cancelled = false;
        await analysisRun({
            source,
            destination,
            token: analysisToken,
            onProgress: (data) => {
                mainWindow.webContents.send('analysis-progress', data);
            },
            onStepAdded: (step) => {
                mainWindow.webContents.send('analysis-step-added', step);
            },
        });
        if (!analysisToken.cancelled) {
            mainWindow.webContents.send('analysis-completed');
        }
    });

    ipcMain.handle('analysis-cancel', async () => {
        analysisToken.cancelled = true;
        return { ok: true };
    });

    // Backup
    ipcMain.handle('backup-start', async (_evt, { source, destination, plan }) => {
        backupToken.cancelled = false;

        await backupRun({
            source,
            destination,
            token: backupToken,
            plan,
            onProgress: (payload) => {
                mainWindow.webContents.send('backup-progress', payload);
            },
        });

        if (backupToken.cancelled) {
            mainWindow.webContents.send('backup-cancelled');
        }

        return { ok: true };
    });

    ipcMain.handle('backup-cancel', async () => {
        backupToken.cancelled = true;
        return { ok: true };
    });

    // iOS specific
    app.on('activate', () => {
        const active = BrowserWindow.getAllWindows();
        if (!active.length) {
            createWindow();
        } else {
            [mainWindow] = active;
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    mainWindow = null;
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
