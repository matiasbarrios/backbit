// Requirements
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';


// Constants
const { readFile, mkdir, writeFile } = fs.promises;

const historyFilePath = path.join(app.getPath('userData'), 'history.json');


// Exported
export const historyRead = async () => {
    try {
        const data = await readFile(historyFilePath, 'utf8');
        const res = JSON.parse(data);
        if (Array.isArray(res)) return res;
    } catch {
        // Do nothing
    }
    return [];
};


export const historyWrite = async (h) => {
    try {
        await mkdir(path.dirname(historyFilePath), { recursive: true });
        await writeFile(historyFilePath, JSON.stringify(h, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving history:', error.message);
    }
};
