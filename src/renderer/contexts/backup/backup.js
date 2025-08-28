// Requirements
import { useCallback } from 'react';


// Exported
export const useBackupSession = (state, dispatch) => {
    const { backupRunning, planProgress } = state;

    const backupStart = useCallback(async (source, destination, steps) => {
        if (!steps || steps.length === 0 || backupRunning) return;

        const unsubscribeCancelled = window.api.onBackupCancelled(() => {
            Object.entries(planProgress).forEach(([ path, p ]) => {
                if (!p.stepProcessing || p.stepDone) return;
                dispatch({
                    type: 'BACKUP_STEP_UPDATE',
                    stepPath: path,
                    updates: { stepProcessing: false, stepCancelled: true },
                });
            });
            dispatch({ type: 'BACKUP_CANCEL' });
            unsubscribeCancelled();
        });

        dispatch({ type: 'BACKUP_START' });

        const unsubscribeProgress = window.api.onBackupProgress((e) => {
            if (!e) return;

            // Plan done
            if (e.planDone) {
                dispatch({ type: 'BACKUP_COMPLETE' });
                unsubscribeProgress();
                unsubscribeCancelled();
                return;
            }

            // Step events
            const updates = {
                stepCopiedBytes: e.stepCopiedBytes,
            };

            if (e.progressType === 'backup-file-start') {
                updates.stepProcessing = true;
            } else if (e.progressType === 'backup-file-done') {
                updates.stepProcessing = false;
                updates.stepDone = true;
            }

            dispatch({
                type: 'BACKUP_STEP_UPDATE',
                stepPath: e.stepPath,
                updates,
            });
        });

        try {
            await window.api.backupStart(source, destination, steps);
        } catch (error) {
            console.error('Backup error:', error);
            dispatch({ type: 'BACKUP_CANCEL' });
        }
    }, [backupRunning, planProgress, dispatch]);

    const backupCancel = useCallback(async () => {
        await window.api.backupCancel();
        dispatch({ type: 'BACKUP_CANCEL' });
    }, [dispatch]);

    const backupClear = useCallback(async () => {
        await window.api.backupCancel();
        dispatch({ type: 'BACKUP_CLEAR' });
    }, [dispatch]);

    const backupSingleStepRun = useCallback(async (source, destination, step) => {
        if (!step || backupRunning) return;
        await backupStart(source, destination, [step]);
    },
    [backupStart, backupRunning]);

    return {
        backupStart,
        backupCancel,
        backupClear,
        backupSingleStepRun,
    };
};
