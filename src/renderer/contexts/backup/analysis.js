// Requirements
import { useCallback } from 'react';


// Exported
export const useAnalysis = (state, dispatch) => {
    const { source, destination, analysisRunning } = state;

    const analysisStart = useCallback(async (source, destination) => {
        if (!source || !destination || analysisRunning) return;

        dispatch({ type: 'ANALYSIS_START', source, destination });

        const unsubscribeOnAnalysisProgress = window.api.onAnalysisProgress(({ path }) => {
            dispatch({ type: 'ANALYSIS_PROGRESS', path });
        });

        const unsubscribeOnAnalysisStepAdded = window.api.onAnalysisStepAdded((step) => {
            dispatch({ type: 'ANALYSIS_STEP_ADD', step });
        });

        const unsubscribeOnAnalysisCompleted = window.api.onAnalysisCompleted(() => {
            dispatch({ type: 'ANALYSIS_COMPLETE' });
            unsubscribeOnAnalysisProgress();
            unsubscribeOnAnalysisStepAdded();
            unsubscribeOnAnalysisCompleted();
        });

        try {
            await window.api.analysisStart(source, destination);
        } catch (error) {
            console.error('Analysis error:', error);
            try {
                unsubscribeOnAnalysisProgress();
                unsubscribeOnAnalysisStepAdded();
                unsubscribeOnAnalysisCompleted();
            } catch {
                // Nothing
            }
            dispatch({ type: 'ANALYSIS_CANCEL' });
        }
    },
    [analysisRunning, dispatch]);

    const analysisRestart = useCallback(async () => {
        await analysisStart(source, destination);
    }, [source, destination, analysisStart]);

    const analysisCancel = useCallback(async () => {
        await window.api.analysisCancel();
        dispatch({ type: 'ANALYSIS_CANCEL' });
    }, [dispatch]);

    const analysisClear = useCallback(async () => {
        await window.api.analysisCancel();
        dispatch({ type: 'ANALYSIS_CLEAR' });
    }, [dispatch]);

    return {
        analysisStart,
        analysisRestart,
        analysisCancel,
        analysisClear,
    };
};
