// Requirements
import fs from 'node:fs';
import path from 'node:path';
import { doAsync } from '../helpers/iterator';


// Constants
const { readdir, stat } = fs.promises;

const FILE_MTIME_DIFF_TOLERANCE_MS = 1500;

const toIgnore = name => name.startsWith('._') || name === '.DS_Store';


// Exported
export const analysisRun = async ({
    source,
    destination,
    token,
    onProgress,
    onStepAdded,
}) => {
    const sourceSeen = new Set();

    // Navigate source, stream copy/updates
    const sourceStack = ['.'];

    const sourceProcess = async () => {
        if (!sourceStack.length) return;
        if (token.cancelled) return;

        const sourceRelativeDir = sourceStack.pop();
        const sourceAbsoluteDir = path.join(source, sourceRelativeDir);

        onProgress({ path: sourceAbsoluteDir });

        const sourceDirEntries = await readdir(sourceAbsoluteDir, { withFileTypes: true });

        // On Each entry
        await doAsync(sourceDirEntries, async (e) => {
            if (token.cancelled) return;
            if (toIgnore(e.name)) return;

            const sourceRelativePath = path.join(sourceRelativeDir, e.name);
            const sourceAbsolutePath = path.join(source, sourceRelativePath);
            const sourceStat = await stat(sourceAbsolutePath);

            // If a folder, add to stack
            if (e.isDirectory()) {
                sourceStack.push(sourceRelativePath);
                return;
            }

            // If a file, compare with destination
            sourceSeen.add(sourceRelativePath);

            // Get destination stats, if it exists
            const destinationAbsolutePath = path.join(destination, sourceRelativePath);
            let destinationStat = null;
            try {
                destinationStat = await stat(destinationAbsolutePath);
            } catch {
                // Do nothing
            }

            // Check if needs to be added or copied
            const toAdd = !destinationStat || !destinationStat.isFile();
            let sizeDiffers = false;
            let mtimeDiffers = false;

            // If entry already exists in destination, check if it needs to be updated
            if (!toAdd) {
                sizeDiffers = destinationStat.size !== sourceStat.size;
                mtimeDiffers = Math.abs((destinationStat.mtimeMs || 0) - (sourceStat.mtimeMs || 0)) > FILE_MTIME_DIFF_TOLERANCE_MS;
            }

            const needsCopy = toAdd || sizeDiffers || mtimeDiffers;

            if (needsCopy) {
                const step = {
                    action: 'copy',
                    relativePath: sourceRelativePath,
                    sourceSize: sourceStat.size,
                    toAdd,
                    sizeDiffers,
                    mtimeDiffers,
                };
                onStepAdded(step);
            }
        });
        await sourceProcess();
    };

    await sourceProcess();

    // Navigate destination, stream deletions
    const destinationStack = ['.'];
    const destinationProcess = async () => {
        if (!destinationStack.length) return;
        if (token.cancelled) return;

        const destinationRelativeDir = destinationStack.pop();
        const destinationAbsoluteDir = path.join(destination, destinationRelativeDir);

        onProgress({ path: destinationAbsoluteDir });

        const destinationDirEntries = await readdir(destinationAbsoluteDir, { withFileTypes: true });

        // On Each entry
        await doAsync(destinationDirEntries, async (e) => {
            if (token.cancelled) return;
            if (toIgnore(e.name)) return;

            const destinationRelativePath = path.join(destinationRelativeDir, e.name);

            // If a folder, add to stack
            if (e.isDirectory()) {
                destinationStack.push(destinationRelativePath);
                return;
            }

            // If a file, check if it needs to be deleted
            if (!sourceSeen.has(destinationRelativePath)) {
                const step = {
                    action: 'delete',
                    relativePath: destinationRelativePath,
                };
                onStepAdded(step);
            }
        });
        await destinationProcess();
    };

    await destinationProcess();
};
