// Requirements
import { useCallback, useMemo } from 'react';
import { useSync } from '../contexts/sync.jsx';

// Exported
const useSyncOperations = () => {
    const { state, dispatch } = useSync();

    const startSync = useCallback(async (srcPath, dstPath, steps) => {
        if (!steps || steps.length === 0 || state.sessionActive) return;

        dispatch({ type: 'START_SYNC' });

        const unsubscribeProgress = window.api.onProgress((payload) => {
            if (payload?.done) {
                dispatch({ type: 'COMPLETE_SYNC' });
                unsubscribeProgress();
                unsubscribeStopped();
                return;
            }

            if (!payload) return;

            // Update individual file progress
            if (payload.type && payload.step) {
                const updates = {};

                if (payload.type === 'file-start') {
                    updates.processing = true;
                } else if (payload.type === 'file-progress') {
                    updates.progress = payload.fileCopiedBytes;
                } else if (payload.type === 'file-done') {
                    updates.processing = false;
                    updates.done = true;
                }

                dispatch({
                    type: 'UPDATE_ROW_STATUS',
                    path: payload.step.relativePath,
                    updates,
                });
            }

            // Update global progress
            const progressData = {
                sessionCopiedBytes: payload.copiedBytes || 0,
                progressPercent:
						state.totalBytesToCopy > 0
						    ? Math.min(100,
						        Math.floor(((state.executedBytes + (payload.copiedBytes || 0)) /
											state.totalBytesToCopy) *
											100))
						    : 100,
            };

            dispatch({ type: 'UPDATE_PROGRESS', progressData });
        });

        const unsubscribeStopped = window.api.onSyncStopped(() => {
            // Mark processing items as cancelled
            for (const [path, entry] of state.rowByPath.entries()) {
                if (entry.processing && !entry.done) {
                    dispatch({
                        type: 'UPDATE_ROW_STATUS',
                        path,
                        updates: { processing: false, cancelled: true },
                    });
                }
            }
            dispatch({ type: 'CANCEL_SYNC' });
            unsubscribeStopped();
        });

        try {
            await window.api.sync(srcPath, dstPath, steps);
        } catch (error) {
            console.error('Sync error:', error);
            dispatch({ type: 'CANCEL_SYNC' });
        }
    },
    [
        state.sessionActive,
        state.totalBytesToCopy,
        state.executedBytes,
        state.rowByPath,
        dispatch,
    ]);

    const cancelSync = useCallback(async () => {
        await window.api.cancelSync();
        dispatch({ type: 'CANCEL_SYNC' });
    }, [dispatch]);

    const runSingleStep = useCallback(async (step, srcPath, dstPath) => {
        if (!step || state.sessionActive) return;
        await startSync(srcPath, dstPath, [step]);
    },
    [startSync, state.sessionActive]);

    const sessionActive = useMemo(() => state.sessionActive,
        [state.sessionActive]);
    const progressPercent = useMemo(() => state.progressPercent,
        [state.progressPercent]);
    const showProgress = useMemo(() => state.showProgress, [state.showProgress]);

    return useMemo(() => ({
        startSync,
        cancelSync,
        runSingleStep,
        sessionActive,
        progressPercent,
        showProgress,
    }),
    [
        startSync,
        cancelSync,
        runSingleStep,
        sessionActive,
        progressPercent,
        showProgress,
    ]);
};

export default useSyncOperations;
