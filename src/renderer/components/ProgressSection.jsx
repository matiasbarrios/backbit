// Requirements

import { Card, Flex, Progress, Text } from '@radix-ui/themes';
import { useMemo } from 'react';
import { useSync } from '../contexts/sync.jsx';
import useSyncOperations from '../hooks/useSyncOperations.js';

// Exported
const ProgressSection = () => {
    const { state } = useSync();
    const { showProgress, progressPercent } = useSyncOperations();

    const hasRemainingItems = useMemo(() =>
        state.plan.some((p) => {
            const entry = state.rowByPath.get(p.relativePath);
            return entry && !entry.done;
        }),
    [state.plan, state.rowByPath]);

    const statusText = useMemo(() => {
        if (state.sessionActive) return 'Sincronizando...';
        return hasRemainingItems ? 'Pausado' : 'Completado';
    }, [state.sessionActive, hasRemainingItems]);

    if (!showProgress) {
        return null;
    }

    return (
        <Card mt="4">
            <Flex direction="column" gap="2">
                <Progress value={progressPercent} style={{ height: '10px' }} />
                <Flex justify="between">
                    <Text size="2" color="gray">
                        {statusText}
                    </Text>
                    <Text
                        size="2"
                        color="gray"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                        {progressPercent}%
                    </Text>
                </Flex>
            </Flex>
        </Card>
    );
};

export default ProgressSection;
