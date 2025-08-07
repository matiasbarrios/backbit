// Requirements
import fs from 'node:fs';
import path from 'node:path';

// Constants
const fsp = fs.promises;
const MTIME_TOLERANCE_MS = 1500;

// Exported
export const analyzeSync = async (
    srcDir,
    dstDir,
    cancelToken,
    progressCallback,
    itemCallback,
    stopCallback
) => {
    const emitProgress = (side, absolutePath) => {
        progressCallback({ side, path: absolutePath });
    };

    /** @type {Array<{action: 'copy'|'delete', relativePath: string, size?: number, added?: boolean, mtimeDiffers?: boolean, sizeDiffers?: boolean}>} */
    const plan = [];
    let totalBytesToCopy = 0;
    const srcSeen = new Set();

    // Phase 1: walk source, stream copy/updates
    const stackSrc = ['.'];
    while (stackSrc.length) {
        if (cancelToken.cancelled) {
            stopCallback({ reason: 'user', phase: 'src' });
            break;
        }
        const relDir = stackSrc.pop();
        const absDir = path.join(srcDir, relDir);
        emitProgress('src', absDir);
        const dirents = await fsp.readdir(absDir, { withFileTypes: true });
        for (const dirent of dirents) {
            if (cancelToken.cancelled) break;
            if (dirent.name.startsWith('._') || dirent.name === '.DS_Store') continue;
            const rel = path.join(relDir, dirent.name);
            const abs = path.join(srcDir, rel);
            const stat = await fsp.stat(abs);
            if (dirent.isDirectory()) {
                stackSrc.push(rel);
            } else if (dirent.isFile()) {
                srcSeen.add(rel);
                // Compare with destination
                const dstAbs = path.join(dstDir, rel);
                let dstat = null;
                try {
                    dstat = await fsp.stat(dstAbs);
                } catch {
                    // Do nothing
                }
                const added = !dstat || !dstat.isFile();
                let sizeDiffers = false;
                let mtimeDiffers = false;
                if (!added) {
                    sizeDiffers = dstat.size !== stat.size;
                    mtimeDiffers =
						Math.abs((dstat.mtimeMs || 0) - (stat.mtimeMs || 0)) >
						MTIME_TOLERANCE_MS;
                }
                const needsCopy = added || sizeDiffers || mtimeDiffers;
                if (needsCopy) {
                    const step = {
                        action: 'copy',
                        relativePath: rel,
                        size: stat.size,
                        added,
                        sizeDiffers,
                        mtimeDiffers,
                    };
                    plan.push(step);
                    totalBytesToCopy += stat.size;
                    itemCallback(step);
                }
            }
        }
    }

    // Phase 2: walk destination, stream deletions
    const stackDst = ['.'];
    while (stackDst.length) {
        if (cancelToken.cancelled) {
            stopCallback({ reason: 'user', phase: 'dst' });
            break;
        }
        const relDir = stackDst.pop();
        const absDir = path.join(dstDir, relDir);
        emitProgress('dst', absDir);
        const dirents = await fsp.readdir(absDir, { withFileTypes: true });
        for (const dirent of dirents) {
            if (cancelToken.cancelled) break;
            if (dirent.name.startsWith('._') || dirent.name === '.DS_Store') continue;
            const rel = path.join(relDir, dirent.name);
            const abs = path.join(dstDir, rel);
            await fsp.stat(abs); // Check if file exists
            if (dirent.isDirectory()) {
                stackDst.push(rel);
            } else if (dirent.isFile()) {
                if (!srcSeen.has(rel)) {
                    const step = { action: 'delete', relativePath: rel };
                    plan.push(step);
                    itemCallback(step);
                }
            }
        }
    }

    return { plan, totalBytesToCopy };
};
