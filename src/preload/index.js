// Requirements
import { contextBridge, ipcRenderer } from 'electron';


// Exported
const electronAPI = {
    ipcRenderer: {
        sendMessage(channel, ...args) {
            ipcRenderer.send(channel, ...args);
        },
        on(channel, func) {
            const validChannels = [
                'analysis-step-added',
                'analysis-progress',
                'analysis-completed',
                'backup-progress',
                'backup-cancelled',
            ];
            if (validChannels.includes(channel)) {
                const subscription = (_event, ...args) => func(...args);
                ipcRenderer.on(channel, subscription);
                return () => ipcRenderer.removeListener(channel, subscription);
            }
            return () => {};
        },
        once(channel, func) {
            const validChannels = [
                'analysis-step-added',
                'analysis-progress',
                'analysis-completed',
                'backup-progress',
                'backup-cancelled',
            ];
            if (validChannels.includes(channel)) {
                ipcRenderer.once(channel, (_event, ...args) => func(...args));
            }
        },
        invoke(channel, ...args) {
            const validChannels = [
                'settings-read',
                'settings-write',

                'history-read',
                'history-write',

                'folder-pick',
                'folder-reveal-in-origin',

                'analysis-start',
                'analysis-cancel',

                'backup-start',
                'backup-cancel',
            ];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, ...args);
            }
            return () => {};
        },
    },
};


const api = {
    // Settings
    settingsRead: () => ipcRenderer.invoke('settings-read'),
    settingsWrite: payload => ipcRenderer.invoke('settings-write', payload),

    // History
    historyRead: () => ipcRenderer.invoke('history-read'),
    historyWrite: h => ipcRenderer.invoke('history-write', h),

    // Folders
    folderPick: () => ipcRenderer.invoke('folder-pick'),
    foldersRevealInOrigin: (source, relativePath) =>
        ipcRenderer.invoke('folder-reveal-in-origin', { source, relativePath }),

    // Analysis
    onAnalysisStepAdded: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('analysis-step-added', listener);
        return () => ipcRenderer.removeListener('analysis-step-added', listener);
    },
    onAnalysisProgress: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('analysis-progress', listener);
        return () => ipcRenderer.removeListener('analysis-progress', listener);
    },
    onAnalysisCompleted: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('analysis-completed', listener);
        return () => ipcRenderer.removeListener('analysis-completed', listener);
    },
    analysisStart: (source, destination) => ipcRenderer.invoke('analysis-start', { source, destination }),
    analysisCancel: () => ipcRenderer.invoke('analysis-cancel'),

    // Backup
    backupStart: (source, destination, plan) =>
        ipcRenderer.invoke('backup-start', { source, destination, plan }),
    backupCancel: () => ipcRenderer.invoke('backup-cancel'),
    onBackupCancelled: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('backup-cancelled', listener);
        return () => ipcRenderer.removeListener('backup-cancelled', listener);
    },
    onBackupProgress: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('backup-progress', listener);
        return () => ipcRenderer.removeListener('backup-progress', listener);
    },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('api', api);
    } catch (error) {
        console.error(error);
    }
} else {
    window.electron = electronAPI;
    window.api = api;
}
