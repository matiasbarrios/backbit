 

// Requirements
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import useFolders from '../hooks/useFolders.js';

// Constants
const Context = createContext();

const initialState = {
    srcPath: '',
    dstPath: '',
    plan: [],
    totalBytesToCopy: 0,
    executedBytes: 0,
    sessionCopiedBytes: 0,
    sessionActive: false,
    autoScroll: true,
    rowByPath: new Map(),
    // Analysis state
    isAnalyzing: false,
    analyzeText: 'Analizando…',
    // Progress state
    showProgress: false,
    progressPercent: 0,
    // Folder pairs history
    folderPairs: [],
};

// Internal
const syncReducer = (state, action) => {
    switch (action.type) {
    case 'SET_PATHS':
        return {
            ...state,
            srcPath: action.srcPath || state.srcPath,
            dstPath: action.dstPath || state.dstPath,
        };

    case 'SET_FOLDER_PAIRS':
        return {
            ...state,
            folderPairs: action.pairs,
        };

    case 'START_ANALYSIS':
        return {
            ...state,
            isAnalyzing: true,
            plan: [],
            totalBytesToCopy: 0,
            rowByPath: new Map(),
        };

    case 'UPDATE_ANALYZE_TEXT':
        return {
            ...state,
            analyzeText: action.text,
        };

    case 'ADD_ANALYZE_ITEM': {
        const newRowByPath = new Map(state.rowByPath);
        newRowByPath.set(action.step.relativePath, {
            step: action.step,
            done: false,
            processing: false,
        });
        return {
            ...state,
            plan: [...state.plan, action.step],
            rowByPath: newRowByPath,
        };
    }

    case 'COMPLETE_ANALYSIS':
        return {
            ...state,
            isAnalyzing: false,
            plan: action.plan,
            totalBytesToCopy: action.totalBytesToCopy,
        };

    case 'CANCEL_ANALYSIS':
        return {
            ...state,
            isAnalyzing: false,
            analyzeText: 'Análisis detenido por el usuario',
        };

    case 'START_SYNC':
        return {
            ...state,
            sessionActive: true,
            sessionCopiedBytes: 0,
            showProgress: true,
        };

    case 'UPDATE_PROGRESS':
        return {
            ...state,
            ...action.progressData,
        };

    case 'COMPLETE_SYNC':
        return {
            ...state,
            sessionActive: false,
            executedBytes: state.executedBytes + state.sessionCopiedBytes,
            sessionCopiedBytes: 0,
        };

    case 'CANCEL_SYNC':
        return {
            ...state,
            sessionActive: false,
        };

    case 'TOGGLE_AUTOSCROLL':
        return {
            ...state,
            autoScroll: !state.autoScroll,
        };

    case 'UPDATE_ROW_STATUS': {
        const updatedRowByPath = new Map(state.rowByPath);
        const existingRow = updatedRowByPath.get(action.path);
        if (existingRow) {
            updatedRowByPath.set(action.path, {
                ...existingRow,
                ...action.updates,
            });
        }
        return {
            ...state,
            rowByPath: updatedRowByPath,
        };
    }

    default:
        return state;
    }
};

const useSyncLogic = () => {
    const [state, dispatch] = useReducer(syncReducer, initialState);
    const { loadFolderPairs } = useFolders();

    // Load folder pairs on mount
    useEffect(() => {
        const loadPairs = async () => {
            const pairs = await loadFolderPairs();
            dispatch({ type: 'SET_FOLDER_PAIRS', pairs });
        };

        loadPairs();
    }, [loadFolderPairs]);

    // Helper functions
    const updateButtons = useMemo(() => ({
        analyzeReady: Boolean(state.srcPath && state.dstPath),
        syncReady: state.plan.length > 0 && !state.sessionActive,
    }),
    [state.srcPath, state.dstPath, state.plan.length, state.sessionActive]);

    const formatBytes = useCallback((bytes) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }, []);

    return useMemo(() => ({
        state,
        dispatch,
        updateButtons,
        formatBytes,
    }),
    [state, updateButtons, formatBytes]);
};

// Exported
export const SyncContext = ({ children }) => {
    const sync = useSyncLogic();
    return <Context.Provider value={sync}>{children}</Context.Provider>;
};

export const useSync = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useSync must be used within a SyncContext');
    }
    return context;
};
