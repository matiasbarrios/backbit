// Requirements
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

// Constants
const fsp = fs.promises;

// Exported
export const loadPairs = async () => {
    try {
        const filePath = path.join(app.getPath('userData'), 'pairs.json');
        const data = await fsp.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Do nothing
    }
    return [];
};

export const savePairs = async (pairs) => {
    try {
        const filePath = path.join(app.getPath('userData'), 'pairs.json');
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
        await fsp.writeFile(filePath, JSON.stringify(pairs, null, 2), 'utf8');
    } catch {
        // Do nothing
    }
};

export const loadSettings = async () => {
    try {
        const filePath = path.join(app.getPath('userData'), 'settings.json');
        const data = await fsp.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        // Do nothing
    }
    return {};
};

export const saveSettings = async (settings) => {
    try {
        const filePath = path.join(app.getPath('userData'), 'settings.json');
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
        await fsp.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf8');
    } catch {
        // Do nothing
    }
};
