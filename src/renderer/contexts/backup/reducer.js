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

        // Check if step already exists to avoid duplicates
        const existingStepIndex = state.plan.findIndex(existingStep => existingStep.relativePath === step.relativePath);

        planProgress[step.relativePath] = {
            step,
            stepDone: false,
            stepProcessing: false,
        };

        if (existingStepIndex >= 0) {
            // Replace existing step
            const newPlan = state.plan.map((existingStep, index) => index === existingStepIndex ? step : existingStep);

            const oldStepBytes = state.plan[existingStepIndex].action === 'copy' ? state.plan[existingStepIndex].sourceSize : 0;
            const newStepBytes = step.action === 'copy' ? step.sourceSize : 0;
            const bytesToAdd = newStepBytes - oldStepBytes;

            return {
                ...state,
                plan: newPlan,
                planProgress,
                planTotalBytesToCopy: state.planTotalBytesToCopy + bytesToAdd,
            };
        } else {
            // Add new step
            return {
                ...state,
                plan: [...state.plan, step],
                planProgress,
                planTotalBytesToCopy: state.planTotalBytesToCopy + (step.action === 'copy' ? step.sourceSize : 0),
            };
        }
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

    case 'BACKUP_START': {
        // Reset cancelled state for all steps when starting a new backup
        const planProgress = { ...state.planProgress };
        Object.keys(planProgress)
            .filter(stepPath => planProgress[stepPath].stepCancelled)
            .forEach((stepPath) => {
                planProgress[stepPath] = {
                    ...planProgress[stepPath],
                    stepCancelled: false,
                    stepProcessing: false,
                    stepDone: false,
                    stepCopiedBytes: 0,
                };
            });

        return {
            ...state,
            backupRunning: true,
            planProgress,
        };
    }

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

    case 'BACKUP_CANCEL': {
        const planProgress = { ...state.planProgress };
        Object.keys(planProgress)
            .filter(stepPath => planProgress[stepPath].stepProcessing && !planProgress[stepPath].stepDone)
            .forEach((stepPath) => {
                planProgress[stepPath] = {
                    ...planProgress[stepPath],
                    stepProcessing: false,
                    stepCancelled: true,
                };
            });

        return {
            ...state,
            backupRunning: false,
            planProgress,
        };
    }

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
