// Requirements
import { createContext, useContext, useMemo, useReducer } from 'react';
import { backupInitialState, backupReducer } from './reducer.js';
import { useAnalysis } from './analysis.js';
import { useBackupSession } from './backup.js';


// Constants
const Context = createContext();


// Exported
export const BackupContext = ({ children }) => {
    const [state, dispatch] = useReducer(backupReducer, backupInitialState);

    const v = useMemo(() => ({
        state,
        dispatch,
    }),
    [state, dispatch]);

    return <Context.Provider value={v}>{children}</Context.Provider>;
};


export const useBackup = () => {
    const { state, dispatch } = useContext(Context);

    const { source, destination } = state;

    const { analysisRequested, analysisRunning, analysisCompleted, analysisCurrentPath } = state;
    const { analysisStart, analysisRestart, analysisCancel, analysisClear } = useAnalysis(state, dispatch);

    const { plan, planTotalBytesToCopy, planProgress } = state;

    const { backupRunning } = state;
    const { backupStart, backupCancel, backupClear, backupSingleStepRun } = useBackupSession(state, dispatch);

    return {
        // Paths,
        source,
        destination,

        // Analysis
        analysisRequested,
        analysisRunning,
        analysisCompleted,
        analysisCurrentPath,
        analysisStart,
        analysisRestart,
        analysisCancel,
        analysisClear,

        // Plan
        plan,
        planTotalBytesToCopy,
        planProgress,

        // Backup
        backupStart,
        backupCancel,
        backupClear,
        backupSingleStepRun,
        backupRunning,
    };
};
