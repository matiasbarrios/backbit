// Requirements
import { useCallback, useMemo } from 'react';
import { useSync } from '../contexts/sync.jsx';

// Exported
const useAnalysis = () => {
    const { state, dispatch } = useSync();

    const startAnalysis = useCallback(async (srcPath, dstPath) => {
        if (!srcPath || !dstPath || state.sessionActive) return;

        dispatch({ type: 'START_ANALYSIS' });

        // Setup event listeners
        const unsubscribeAnalyze = window.api.onAnalyze(({ side, path }) => {
            const text = `Analizando ${side === 'src' ? 'origen' : 'destino'}: ${path}`;
            dispatch({ type: 'UPDATE_ANALYZE_TEXT', text });
        });

        const unsubscribeItem = window.api.onAnalyzeItem((step) => {
            dispatch({ type: 'ADD_ANALYZE_ITEM', step });
        });

        const unsubscribeComplete = window.api.onAnalyzeComplete(({ plan, totalBytesToCopy }) => {
            dispatch({
                type: 'COMPLETE_ANALYSIS',
                plan,
                totalBytesToCopy,
            });
            unsubscribeAnalyze();
            unsubscribeItem();
            unsubscribeComplete();
        });

        try {
            await window.api.analyze(srcPath, dstPath);
        } catch (error) {
            console.error('Analysis error:', error);
            try {
                unsubscribeAnalyze();
                unsubscribeItem();
                unsubscribeComplete();
            } catch {
                // Nothing
            }
            dispatch({ type: 'CANCEL_ANALYSIS' });
        }
    },
    [state.sessionActive, dispatch]);

    const cancelAnalysis = useCallback(async () => {
        await window.api.cancelAnalyze();
        dispatch({ type: 'CANCEL_ANALYSIS' });
    }, [dispatch]);

    const isAnalyzing = useMemo(() => state.isAnalyzing, [state.isAnalyzing]);
    const analyzeText = useMemo(() => state.analyzeText, [state.analyzeText]);

    return useMemo(() => ({
        startAnalysis,
        cancelAnalysis,
        isAnalyzing,
        analyzeText,
    }),
    [startAnalysis, cancelAnalysis, isAnalyzing, analyzeText]);
};

export default useAnalysis;
