// Requirements
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';


// Constants
const { readFile, mkdir, writeFile } = fs.promises;

const settingsFilePath = path.join(app.getPath('userData'), 'settings.json');


// Exported
export const settingsRead = async () => {
    try {
        const data = await readFile(settingsFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        // Do nothing
    }
    return {};
};


export const settingsWrite = async (settings) => {
    try {
        const current = await settingsRead();
        await mkdir(path.dirname(settingsFilePath), { recursive: true });
        await writeFile(settingsFilePath, JSON.stringify({ ...current, ...settings }, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving settings:', error.message);
    }
};
