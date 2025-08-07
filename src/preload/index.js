import { contextBridge, ipcRenderer } from 'electron';

// Basic electron APIs
const electronAPI = {
    ipcRenderer: {
        sendMessage(channel, ...args) {
            ipcRenderer.send(channel, ...args);
        },
        on(channel, func) {
            const validChannels = [
                'analyze-progress',
                'analyze-item',
                'analyze-complete',
                'analyze-stopped',
                'sync-progress',
                'sync-stopped',
            ];
            if (validChannels.includes(channel)) {
                const subscription = (_event, ...args) => func(...args);
                ipcRenderer.on(channel, subscription);
                return () => ipcRenderer.removeListener(channel, subscription);
            }
        },
        once(channel, func) {
            const validChannels = [
                'analyze-progress',
                'analyze-item',
                'analyze-complete',
                'analyze-stopped',
                'sync-progress',
                'sync-stopped',
            ];
            if (validChannels.includes(channel)) {
                ipcRenderer.once(channel, (_event, ...args) => func(...args));
            }
        },
        invoke(channel, ...args) {
            const validChannels = [
                'pick-folder',
                'analyze',
                'analyze-cancel',
                'sync',
                'sync-cancel',
                'reveal-in-origin',
                'pairs-list',
                'pairs-delete',
                'settings-get',
                'settings-set',
            ];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, ...args);
            }
        },
    },
};

// Custom APIs for renderer
const api = {
    pickFolder: () => ipcRenderer.invoke('pick-folder'),
    analyze: (srcDir, dstDir) =>
        ipcRenderer.invoke('analyze', { srcDir, dstDir }),
    cancelAnalyze: () => ipcRenderer.invoke('analyze-cancel'),
    sync: (srcDir, dstDir, plan) =>
        ipcRenderer.invoke('sync', { srcDir, dstDir, plan }),
    cancelSync: () => ipcRenderer.invoke('sync-cancel'),
    onSyncStopped: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('sync-stopped', listener);
        return () => ipcRenderer.removeListener('sync-stopped', listener);
    },
    listPairs: () => ipcRenderer.invoke('pairs-list'),
    deletePair: (src, dst) => ipcRenderer.invoke('pairs-delete', { src, dst }),
    getSettings: () => ipcRenderer.invoke('settings-get'),
    setSettings: payload => ipcRenderer.invoke('settings-set', payload),
    revealInOrigin: (srcDir, relPath) =>
        ipcRenderer.invoke('reveal-in-origin', { srcDir, relPath }),
    onProgress: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('sync-progress', listener);
        return () => ipcRenderer.removeListener('sync-progress', listener);
    },
    onAnalyze: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('analyze-progress', listener);
        return () => ipcRenderer.removeListener('analyze-progress', listener);
    },
    onAnalyzeItem: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('analyze-item', listener);
        return () => ipcRenderer.removeListener('analyze-item', listener);
    },
    onAnalyzeComplete: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('analyze-complete', listener);
        return () => ipcRenderer.removeListener('analyze-complete', listener);
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
