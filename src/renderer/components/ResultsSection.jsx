// Requirements

import {
    Badge,
    Button,
    Card,
    Flex,
    ScrollArea,
    Spinner,
    Text,
} from '@radix-ui/themes';
import { useCallback, useMemo } from 'react';
import { useI18n } from '../contexts/i18n.jsx';
import { useSync } from '../contexts/sync.jsx';
import useFolders from '../hooks/useFolders.js';
import useSyncOperations from '../hooks/useSyncOperations.js';

// Internal
const AnalyzingIndicator = () => {
    const { state } = useSync();

    if (!state.isAnalyzing) return null;

    return (
        <Flex
            align="center"
            gap="2"
            p="3"
            style={{ borderBottom: '1px dashed var(--gray-6)' }}
        >
            <Spinner size="1" />
            <Text size="2" color="gray" style={{ flex: 1 }}>
                {state.analyzeText}
            </Text>
        </Flex>
    );
};

const StatsBar = () => {
    const { t } = useI18n();
    const { state, formatBytes, dispatch } = useSync();

    return (
        <Flex
            justify="between"
            align="center"
            p="3"
            style={{ borderBottom: '1px solid var(--gray-6)' }}
        >
            <Flex gap="6">
                <Text size="2" color="gray">
                    <Text weight="medium">{t('actions')}:</Text> {state.plan.length}
                </Text>
                <Text size="2" color="gray">
                    <Text weight="medium">{t('toCopy')}:</Text>{' '}
                    {formatBytes(state.totalBytesToCopy)}
                </Text>
            </Flex>

            <Button
                variant="soft"
                size="1"
                onClick={() => dispatch({ type: 'TOGGLE_AUTOSCROLL' })}
            >
                {t('autoScroll')}: {state.autoScroll ? 'ON' : 'OFF'}
            </Button>
        </Flex>
    );
};

const FileRow = ({ step, entry }) => {
    const { t } = useI18n();
    const { state } = useSync();
    const { revealInOrigin } = useFolders();
    const { runSingleStep, sessionActive } = useSyncOperations();

    const getActionText = useCallback(() => {
        if (entry.processing) {
            const percent =
				entry.progress && step.size
				    ? Math.min(100, Math.floor((entry.progress / step.size) * 100))
				    : 0;
            return `${t('copying')} ${percent}%`;
        }

        if (entry.done) {
            return step.action === 'copy' ? t('copied') : t('deleted');
        }

        if (entry.cancelled) {
            return 'Cancelado';
        }

        if (step.action === 'copy') {
            return step.added ? t('copy') : t('update');
        }
        return t('delete');
    }, [
        entry.processing,
        entry.done,
        entry.cancelled,
        entry.progress,
        step.size,
        step.action,
        step.added,
        t,
    ]);

    const getActionColor = useCallback(() => {
        if (entry.done) return 'green';
        if (entry.cancelled) return 'gray';
        if (entry.processing) return 'blue';
        if (step.action === 'copy') return 'blue';
        return 'red';
    }, [entry.done, entry.cancelled, entry.processing, step.action]);

    const getStatusIcon = useCallback(() => {
        if (entry.done) return '✓';
        if (entry.processing) return <Spinner size="1" />;
        return null;
    }, [entry.done, entry.processing]);

    const handlePathClick = useCallback(async () => {
        if (!state.srcPath) return;
        await revealInOrigin(state.srcPath, step.relativePath);
    }, [state.srcPath, step.relativePath, revealInOrigin]);

    const handleBadgeClick = useCallback(async () => {
        if (entry.done || sessionActive || entry.processing) return;
        await runSingleStep(step, state.srcPath, state.dstPath);
    }, [
        entry.done,
        entry.processing,
        sessionActive,
        step,
        state.srcPath,
        state.dstPath,
        runSingleStep,
    ]);

    const progressPercentage = useMemo(() =>
        entry.progress && step.size
            ? Math.min(100, Math.floor((entry.progress / step.size) * 100))
            : 0,
    [entry.progress, step.size]);

    return (
        <Flex
            justify="between"
            align="center"
            p="2"
            style={{
                borderTop: '1px solid var(--gray-4)',
                opacity: entry.done ? 0.7 : 1,
            }}
        >
            <Text
                size="2"
                style={{
                    flex: 1,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(255,255,255,0.3)',
                }}
                onClick={handlePathClick}
                color={step.action === 'copy' ? 'blue' : 'red'}
            >
                {step.relativePath}
            </Text>

            <Flex align="center" gap="2">
                {step.action === 'copy' && !step.added && (
                    <>
                        {step.sizeDiffers && (
                            <Text size="1" title="Contenido diferente">
								◼
                            </Text>
                        )}
                        {step.mtimeDiffers && (
                            <Text size="1" title="Fecha diferente">
								🗓
                            </Text>
                        )}
                    </>
                )}

                {getStatusIcon()}

                {/* Mini progress bar for processing files */}
                {entry.processing && step.size && (
                    <div
                        style={{
                            width: '120px',
                            height: '6px',
                            backgroundColor: 'var(--gray-4)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${progressPercentage}%`,
                                height: '100%',
                                backgroundColor: 'var(--blue-9)',
                                transition: 'width 0.1s linear',
                            }}
                        />
                    </div>
                )}

                <Badge
                    color={getActionColor()}
                    style={{
                        cursor:
							entry.done || sessionActive || entry.processing
							    ? 'default'
							    : 'pointer',
                        minWidth: '104px',
                        textAlign: 'center',
                    }}
                    onClick={handleBadgeClick}
                >
                    {getActionText()}
                </Badge>
            </Flex>
        </Flex>
    );
};

const FilesList = () => {
    const { state } = useSync();

    if (state.plan.length === 0) {
        return null;
    }

    return (
        <ScrollArea style={{ flex: 1 }}>
            {state.plan.map((step) => {
                const entry = state.rowByPath.get(step.relativePath) || {
                    done: false,
                    processing: false,
                };
                return <FileRow key={step.relativePath} step={step} entry={entry} />;
            })}
        </ScrollArea>
    );
};

// Exported
const ResultsSection = () => (
    <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <StatsBar />
        <AnalyzingIndicator />
        <FilesList />
    </Card>
);

export default ResultsSection;
