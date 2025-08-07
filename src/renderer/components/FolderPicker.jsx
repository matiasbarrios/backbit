// Requirements

import { Button, Card, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../contexts/i18n.jsx';
import { useSync } from '../contexts/sync.jsx';
import useAnalysis from '../hooks/useAnalysis.js';
import useFolders from '../hooks/useFolders.js';
import useSyncOperations from '../hooks/useSyncOperations.js';

// Internal
const usePickerLogic = () => {
    const { state, dispatch } = useSync();
    const { pickFolder } = useFolders();
    const { startAnalysis, cancelAnalysis, isAnalyzing } = useAnalysis();
    const { startSync, cancelSync, sessionActive } = useSyncOperations();
    const [showHistorySelect, setShowHistorySelect] = useState(false);

    useEffect(() => {
        setShowHistorySelect(state.folderPairs.length > 0);
    }, [state.folderPairs]);

    const handleSrcPick = useCallback(async () => {
        const dir = await pickFolder();
        if (dir) {
            dispatch({ type: 'SET_PATHS', srcPath: dir });
        }
    }, [pickFolder, dispatch]);

    const handleDstPick = useCallback(async () => {
        const dir = await pickFolder();
        if (dir) {
            dispatch({ type: 'SET_PATHS', dstPath: dir });
        }
    }, [pickFolder, dispatch]);

    const handleHistorySelect = useCallback((srcPath) => {
        if (!srcPath) return;
        const selectedPair = state.folderPairs.find(p => p.src === srcPath);
        if (selectedPair) {
            dispatch({
                type: 'SET_PATHS',
                srcPath: selectedPair.src,
                dstPath: selectedPair.dst,
            });
        }
    },
    [state.folderPairs, dispatch]);

    const handleAnalyze = useCallback(async () => {
        if (!state.srcPath || !state.dstPath) return;
        await startAnalysis(state.srcPath, state.dstPath);
    }, [state.srcPath, state.dstPath, startAnalysis]);

    const handleSync = useCallback(async () => {
        if (!state.srcPath || !state.dstPath || state.plan.length === 0) return;

        const remaining = state.plan.filter((p) => {
            const entry = state.rowByPath.get(p.relativePath);
            return entry && !entry.done;
        });

        if (remaining.length === 0) return;
        await startSync(state.srcPath, state.dstPath, remaining);
    }, [state.srcPath, state.dstPath, state.plan, state.rowByPath, startSync]);

    return useMemo(() => ({
        showHistorySelect,
        handleSrcPick,
        handleDstPick,
        handleHistorySelect,
        handleAnalyze,
        handleSync,
        handleCancelAnalyze: cancelAnalysis,
        handleCancelSync: cancelSync,
        isAnalyzing,
        sessionActive,
    }),
    [
        showHistorySelect,
        handleSrcPick,
        handleDstPick,
        handleHistorySelect,
        handleAnalyze,
        handleSync,
        cancelAnalysis,
        cancelSync,
        isAnalyzing,
        sessionActive,
    ]);
};

// Exported
const FolderPicker = () => {
    const { t } = useI18n();
    const { state, updateButtons } = useSync();
    const {
        showHistorySelect,
        handleSrcPick,
        handleDstPick,
        handleHistorySelect,
        handleAnalyze,
        handleSync,
        handleCancelAnalyze,
        handleCancelSync,
        isAnalyzing,
        sessionActive,
    } = usePickerLogic();

    return (
        <Card>
            <Flex direction={{ initial: 'column', sm: 'row' }} gap="4" align="end">
                <Flex direction="column" style={{ flex: 1 }} gap="2">
                    <Text size="2" weight="medium" color="gray">
                        {t('origin')}
                    </Text>
                    <Flex gap="2">
                        {showHistorySelect ? (
                            <Select.Root
                                value={state.srcPath}
                                onValueChange={handleHistorySelect}
                            >
                                <Select.Trigger placeholder={t('chooseFromHistory')} />
                                <Select.Content>
                                    <Select.Item value={null}>
                                        {t('chooseFromHistory')}
                                    </Select.Item>
                                    {state.folderPairs.map(pair => (
                                        <Select.Item key={pair.src} value={pair.src}>
                                            {pair.src}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        ) : (
                            <TextField.Root
                                value={state.srcPath}
                                placeholder={t('pickPlaceholder')}
                                readOnly
                                style={{ flex: 1 }}
                            />
                        )}
                        <Button onClick={handleSrcPick}>{t('pick')}</Button>
                    </Flex>
                </Flex>

                <Flex direction="column" style={{ flex: 1 }} gap="2">
                    <Text size="2" weight="medium" color="gray">
                        {t('destination')}
                    </Text>
                    <Flex gap="2">
                        <TextField.Root
                            value={state.dstPath}
                            placeholder={t('pickPlaceholder')}
                            readOnly
                            style={{ flex: 1 }}
                        />
                        <Button onClick={handleDstPick}>{t('pick')}</Button>
                    </Flex>
                </Flex>

                <Flex gap="2">
                    {/* Analyze buttons */}
                    {!isAnalyzing ? (
                        <Button
                            disabled={!updateButtons.analyzeReady}
                            onClick={handleAnalyze}
                            size="2"
                        >
                            {t('analyze')}
                        </Button>
                    ) : (
                        <Button variant="soft" onClick={handleCancelAnalyze} size="2">
                            {t('cancelAnalyze')}
                        </Button>
                    )}

                    {/* Sync buttons */}
                    {!sessionActive ? (
                        <Button
                            disabled={!updateButtons.syncReady}
                            onClick={handleSync}
                            size="2"
                            color="green"
                        >
                            {t('sync')}
                        </Button>
                    ) : (
                        <Button
                            variant="soft"
                            onClick={handleCancelSync}
                            size="2"
                            color="red"
                        >
                            {t('cancelSync')}
                        </Button>
                    )}
                </Flex>
            </Flex>
        </Card>
    );
};

export default FolderPicker;
