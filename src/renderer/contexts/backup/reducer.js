// Exported
export const backupInitialState = {
    // Paths
    source: '',
    destination: '',

    // Analysis
    analysisRequested: false,
    analysisRunning: false,
    analysisCompleted: false,
    analysisCurrentPath: null,

    // Plan
    plan: [],
    planProgress: {},
    planTotalBytesToCopy: 0,

    // Backup
    backupRunning: false,
};


export const backupReducer = (state, action) => {
    switch (action.type) {

    case 'ANALYSIS_START':
        return {
            ...state,
            source: action.source,
            destination: action.destination,
            analysisRequested: true,
            analysisRunning: true,
            analysisCompleted: false,
            plan: [],
            planProgress: {},
            planTotalBytesToCopy: 0,
        };

    case 'ANALYSIS_PROGRESS':
        return {
            ...state,
            analysisCurrentPath: action.path,
        };

    case 'ANALYSIS_STEP_ADD': {
        const { step } = action;
        const planProgress = { ...state.planProgress };

        planProgress[step.relativePath] = {
            step,
            stepDone: false,
            stepProcessing: false,
        };

        return {
            ...state,
            plan: [...state.plan, step],
            planProgress,
            planTotalBytesToCopy: state.planTotalBytesToCopy + (step.action === 'copy' ? step.sourceSize : 0),
        };
    }

    case 'ANALYSIS_COMPLETE':
        return {
            ...state,
            analysisRunning: false,
            analysisCompleted: true,
        };

    case 'ANALYSIS_CANCEL':
        return {
            ...state,
            analysisRunning: false,
            analysisCompleted: false,
        };

    case 'ANALYSIS_CLEAR':
        return {
            ...state,
            analysisRequested: false,
            analysisRunning: false,
            analysisCompleted: false,
            analysisCurrentPath: null,
            plan: [],
            planTotalBytesToCopy: 0,
            planProgress: {},
        };

    case 'BACKUP_START':
        return {
            ...state,
            backupRunning: true,
        };

    case 'BACKUP_STEP_UPDATE': {
        const p = state.planProgress[action.stepPath];
        const planProgress = { ...state.planProgress };
        if (p) {
            planProgress[action.stepPath] = {
                ...p,
                ...action.updates,
            };
        }
        return {
            ...state,
            planProgress,
        };
    }

    case 'BACKUP_COMPLETE':
        return {
            ...state,
            backupRunning: false,
        };

    case 'BACKUP_CANCEL':
        return {
            ...state,
            backupRunning: false,
        };

    case 'BACKUP_CLEAR':
        return {
            ...state,
            backupRunning: false,
            plan: [],
            planTotalBytesToCopy: 0,
            planProgress: {},
        };

    default:
        return state;
    }
};
