// Requirements
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { doAsync } from '../helpers/iterator';


// Constants
const { mkdir, unlink, rename, stat, utimes } = fs.promises;

const CONTINUOUS_PROGRESS_THROTTLE = 50; // ms


// Internal
const createDelayTransform = (delayMs = 1000) => new Transform({
    transform(chunk, encoding, callback) {
        // Add delay between chunks for debugging
        setTimeout(() => {
            this.push(chunk);
            callback();
        }, delayMs);
    },
});


// Exported
export const planRun = async ({
    source,
    destination,
    plan,
    onProgress,
    token,
}) => {
    // On Each step
    await doAsync(plan, async (step) => {
        const stepPath = step.relativePath;
        const sourceAbsolutePath = path.join(source, stepPath);
        const destinationAbsolutePath = path.join(destination, stepPath);

        if (token.cancelled) return;

        // Delete
        if (step.action === 'delete') {
            onProgress({ progressType: 'backup-file-start', stepPath });
            try {
                await unlink(destinationAbsolutePath);
            } catch {
                // Ignore
            }
            onProgress({ progressType: 'backup-file-done', stepPath });
            return;
        }

        // Copy (add or update)

        // Ensure destination directory exists
        await mkdir(path.dirname(destinationAbsolutePath), { recursive: true });

        // Initialize a temporary file
        onProgress({ progressType: 'backup-file-start', stepPath, stepCopiedBytes: 0 });

        let stepCopiedBytes = 0;
        const destinationTemporaryPath = `${destinationAbsolutePath}.backbit.${crypto.randomUUID()}.tmp`;
        let read;
        let write;

        try {
            // Copy using streams
            await new Promise((resolve, reject) => {
                read = fs.createReadStream(sourceAbsolutePath);
                write = fs.createWriteStream(destinationTemporaryPath);

                read.on('error', reject);
                write.on('error', reject);

                read.on('data', (chunk) => {
                    stepCopiedBytes += chunk.length;
                    onProgress({
                        progressType: 'backup-file-progress',
                        stepPath,
                        stepCopiedBytes,
                    });
                    if (token?.cancelled) {
                        // Stop streams immediately
                        read.destroy(new Error('cancelled'));
                        write.destroy(new Error('cancelled'));
                    }
                });

                write.on('close', resolve);

                // Add delay transform for debugging (comment out for normal speed)
                const delayTransform = createDelayTransform(1000); // 1 second delay
                read.pipe(delayTransform).pipe(write);

                // For normal speed, use: read.pipe(write);
            });

            if (token?.cancelled) {
                // Cleanup tmp file if present
                try {
                    await unlink(destinationTemporaryPath);
                } catch {
                    // Do nothing
                }
                return;
            }

            // Delete destination file if it exists
            try {
                await unlink(destinationAbsolutePath);
            } catch {
                // Do nothing
            }

            // Rename temporary file to destination
            await rename(destinationTemporaryPath, destinationAbsolutePath);

            // Preserve mtime to match comparison logic
            try {
                const { atime, mtime } = await stat(sourceAbsolutePath);
                await utimes(destinationAbsolutePath, atime, mtime);
            } catch {
                // Do nothing
            }
        } catch (e) {
            // On error, ensure tmp file is removed
            try {
                await unlink(destinationTemporaryPath);
            } catch {
                // Do nothing
            }
            throw e;
        }

        // File done
        onProgress({ progressType: 'backup-file-done', stepPath, stepCopiedBytes });
    });
};


export const backupRun = async ({
    source,
    destination,
    token,
    plan,
    onProgress,
}) => {
    let lastEmit = Date.now();

    // Define our own progress emitter
    const progressEmitter = (payload) => {
        // Emit control messages immediately
        if (payload?.progressType && payload.progressType !== 'backup-file-progress') {
            onProgress(payload);
            return;
        }

        // Throttle continuous progress updates
        const now = Date.now();
        if (now - lastEmit > CONTINUOUS_PROGRESS_THROTTLE) {
            onProgress(payload);
            lastEmit = now;
        }
    };

    // Run the plan
    await planRun({
        source,
        destination,
        plan,
        onProgress: progressEmitter,
        token,
    });

    if (token.cancelled) return;

    // Emit plan done message
    onProgress({ planDone: true });
};
