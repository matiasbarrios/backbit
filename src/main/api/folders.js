// Requirements
import { join } from 'node:path';
import fs from 'node:fs';
import { dialog, shell } from 'electron';


// Constants
const { access, stat } = fs.promises;

// Exported
export const folderPick = mainWindow => async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
};


export const folderRevealInOrigin = async (source, relativePath) => {
    try {
        const target = join(source, relativePath);
        try {
            // Try to open the target
            await access(target);
            shell.showItemInFolder(target);
        } catch {
            // If not found, go up until found
            let current = join(target, '..');
            const rootStop = join(current, '..').split(join.sep)[0] + join.sep;

            const goUp = async () => {
                if (current === rootStop) return;
                try {
                    const st = await stat(current);
                    if (st.isDirectory()) {
                        await shell.openPath(current);
                        return;
                    }
                } catch {
                    // Do nothing
                }
                const parent = join(current, '..');
                if (parent === current) return;
                current = parent;
                await goUp();
            };

            await goUp();
        }
    } catch {
        // Do nothing
    }
};
