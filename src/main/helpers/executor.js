// Requirements
import fs from 'node:fs';
import path from 'node:path';

// Constants
const fsp = fs.promises;

// Internal
const ensureDir = async (dirPath) => {
    await fsp.mkdir(dirPath, { recursive: true });
};

// Exported
export const executePlan = async (
    srcDir,
    dstDir,
    plan,
    onProgress,
    cancelToken
) => {
    let copiedBytes = 0;
    for (const step of plan) {
        // Safety: ignore AppleDouble/.DS_Store if present in plan (should not happen since analysis filters them)
        const baseName = path.basename(step.relativePath);
        if (baseName.startsWith('._') || baseName === '.DS_Store') {
            continue;
        }
        const src = path.join(srcDir, step.relativePath);
        const dst = path.join(dstDir, step.relativePath);
        if (cancelToken?.cancelled) {
            return true;
        }
        if (step.action === 'delete') {
            onProgress({ type: 'file-start', step, copiedBytes });
            try {
                await fsp.unlink(dst);
            } catch {
                // Do nothing - If not a file or doesn't exist, ignore
            }
            onProgress({ type: 'file-done', step, copiedBytes });
        } else if (step.action === 'copy') {
            await ensureDir(path.dirname(dst));
            onProgress({ type: 'file-start', step, copiedBytes });
            let fileCopiedBytes = 0;
            const tmpDst = `${dst}.backbit.tmp`;
            let read;
            let write;
            try {
                await new Promise((resolve, reject) => {
                    read = fs.createReadStream(src);
                    write = fs.createWriteStream(tmpDst);
                    read.on('error', reject);
                    write.on('error', reject);
                    read.on('data', (chunk) => {
                        copiedBytes += chunk.length;
                        fileCopiedBytes += chunk.length;
                        onProgress({
                            type: 'file-progress',
                            step,
                            copiedBytes,
                            fileCopiedBytes,
                        });
                        if (cancelToken?.cancelled) {
                            // Stop streams immediately
                            read.destroy(new Error('cancelled'));
                            write.destroy(new Error('cancelled'));
                        }
                    });
                    write.on('close', resolve);
                    read.pipe(write);
                });
                if (cancelToken?.cancelled) {
                    // Cleanup tmp file if present
                    try {
                        await fsp.unlink(tmpDst);
                    } catch {
                        // Do nothing
                    }
                    return true;
                }
                // Replace destination atomically
                try {
                    await fsp.unlink(dst);
                } catch {
                    // Do nothing
                }
                await fsp.rename(tmpDst, dst);
            } catch (e) {
                // On error, ensure tmp file is removed
                try {
                    await fsp.unlink(tmpDst);
                } catch {
                    // Do nothing
                }
                throw e;
            }
            // Preserve mtime to match comparison logic
            try {
                const stat = await fsp.stat(src);
                await fsp.utimes(dst, stat.atime, stat.mtime);
            } catch {
                // Do nothing
            }
            onProgress({ type: 'file-done', step, copiedBytes });
        }
    }
    return false;
};

export const executeSync = async (
    srcDir,
    dstDir,
    plan,
    progressCallback,
    cancelToken,
    saveSuccessfulPairCallback
) => {
    let lastEmit = Date.now();
    const progressEmitter = (payload) => {
        // Emit control messages immediately; throttle only continuous progress updates
        if (payload?.type && payload?.type !== 'file-progress') {
            progressCallback(payload);
            return;
        }
        const now = Date.now();
        if (now - lastEmit > 50) {
            progressCallback(payload);
            lastEmit = now;
        }
    };

    const wasCancelled = await executePlan(
        srcDir,
        dstDir,
        plan,
        progressEmitter,
        cancelToken
    );

    if (wasCancelled) {
        return { cancelled: true };
    } else {
        progressCallback({ done: true });
        // persist pair on successful sync
        if (saveSuccessfulPairCallback) {
            await saveSuccessfulPairCallback(srcDir, dstDir);
        }
        return { success: true };
    }
};
