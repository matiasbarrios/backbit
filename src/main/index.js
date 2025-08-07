// Requirements
import fs from 'node:fs';
import { join } from 'node:path';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
// eslint-disable-next-line import/no-unresolved
import icon from '../../resources/icon.png?asset';
import { analyzeSync } from './helpers/analyzer.js';
import { executeSync } from './helpers/executor.js';
import {
    loadPairs,
    loadSettings,
    savePairs,
    saveSettings,
} from './helpers/settings.js';


// Constants
const fsp = fs.promises;


// Variables
let mainWindow;
const analyzeCancelToken = { cancelled: false };
const syncCancelToken = { cancelled: false };


// Internal
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 720,
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
    if (process.env.NODE_ENV !== 'production') {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}


// Main
Menu.setApplicationMenu(null);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    // Create the main window
    createWindow();

    // Handlers
    ipcMain.handle('pick-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });

    ipcMain.handle('analyze', async (_evt, { srcDir, dstDir }) => {
        analyzeCancelToken.cancelled = false;

        const progressCallback = (data) => {
            mainWindow.webContents.send('analyze-progress', data);
        };

        const itemCallback = (step) => {
            mainWindow.webContents.send('analyze-item', step);
        };

        const stopCallback = (data) => {
            mainWindow.webContents.send('analyze-stopped', data);
        };

        const result = await analyzeSync(
            srcDir,
            dstDir,
            analyzeCancelToken,
            progressCallback,
            itemCallback,
            stopCallback
        );

        mainWindow.webContents.send('analyze-complete', result);
        return result;
    });

    ipcMain.handle('analyze-cancel', async () => {
        analyzeCancelToken.cancelled = true;
        return { ok: true };
    });

    ipcMain.handle('sync', async (_evt, { srcDir, dstDir, plan }) => {
        syncCancelToken.cancelled = false;

        const progressCallback = (payload) => {
            mainWindow.webContents.send('sync-progress', payload);
        };

        const saveSuccessfulPairCallback = async (srcDir, dstDir) => {
            try {
                const existing = await loadPairs();
                const normalized = p => join(p).replace(/\\/g, '/');
                const srcN = normalized(srcDir);
                const dstN = normalized(dstDir);
                const withoutDup = existing.filter(e => !(e.src === srcN && e.dst === dstN));
                withoutDup.unshift({ src: srcN, dst: dstN, lastSyncedAt: Date.now() });
                const deduped = withoutDup.slice(0, 20); // keep last 20
                await savePairs(deduped);
            } catch {
                // Do nothing
            }
        };

        const result = await executeSync(
            srcDir,
            dstDir,
            plan,
            progressCallback,
            syncCancelToken,
            saveSuccessfulPairCallback
        );

        if (result.cancelled) {
            mainWindow.webContents.send('sync-stopped', { reason: 'user' });
        }

        return { ok: true };
    });

    ipcMain.handle('sync-cancel', async () => {
        syncCancelToken.cancelled = true;
        return { ok: true };
    });

    ipcMain.handle('reveal-in-origin', async (_evt, { srcDir, relPath }) => {
        try {
            const target = join(srcDir, relPath);
            try {
                await fsp.access(target);
                shell.showItemInFolder(target);
                return { ok: true };
            } catch {
                let current = join(target, '..');
                const rootStop = join(current, '..').split(join.sep)[0] + join.sep;
                while (current && current !== rootStop) {
                    try {
                        const st = await fsp.stat(current);
                        if (st.isDirectory()) {
                            await shell.openPath(current);
                            return { ok: true };
                        }
                    } catch {
                        // Do nothing
                    }
                    const parent = join(current, '..');
                    if (parent === current) break;
                    current = parent;
                }
            }
        } catch {
            // Do nothing
        }
        return { ok: false };
    });

    ipcMain.handle('pairs-list', async () => {
        const pairs = await loadPairs();
        return pairs;
    });

    ipcMain.handle('pairs-delete', async (_evt, { src, dst }) => {
        try {
            const pairs = await loadPairs();
            const normalized = p => join(p).replace(/\\/g, '/');
            const srcN = normalized(src);
            const dstN = normalized(dst);
            const filtered = pairs.filter(p => !(p.src === srcN && p.dst === dstN));
            await savePairs(filtered);
            return { ok: true };
        } catch {
            return { ok: false };
        }
    });

    ipcMain.handle('settings-get', async () => await loadSettings());

    ipcMain.handle('settings-set', async (_evt, newSettings) => {
        const current = await loadSettings();
        const merged = { ...current, ...newSettings };
        await saveSettings(merged);
        return merged;
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    mainWindow = null;
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
