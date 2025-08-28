// Requirements
import { Flex, Progress, Separator, Text } from '@radix-ui/themes';
import { useMemo } from 'react';
import { useBackup } from '../../contexts/backup/index.jsx';
import { useI18n } from '../../contexts/i18n.jsx';
import { formatBytes } from '../../helpers/format.js';


// Exported
export default () => {
    const { t } = useI18n();
    const {
        analysisRequested, analysisRunning, analysisCurrentPath,
        plan, planTotalBytesToCopy, planProgress,
        backupRunning,
    } = useBackup();

    const stepsRemaining = useMemo(() => plan.length - Object.values(planProgress).filter(p => p.stepDone).length, [plan, planProgress]);

    const bytesCopiedSoFar = useMemo(() => Object.values(planProgress).reduce((a, p) => a + (p.stepCopiedBytes || 0), 0), [planProgress]);

    const bytesRemaining = useMemo(() => formatBytes(planTotalBytesToCopy - bytesCopiedSoFar), [planTotalBytesToCopy, bytesCopiedSoFar]);

    const backupProgressPercent = useMemo(() => Math.min(100, Math.floor((bytesCopiedSoFar / planTotalBytesToCopy) * 100)), [planTotalBytesToCopy, bytesCopiedSoFar]);

    if (!analysisRequested) return null;

    return (
        <Flex direction="column" align="end" justify="start" gapY="2" width="100%" px="4" py="2">
            <Flex align="center" justify="between" gapX="4" width="100%">
                <Flex align="center" gapX="2" flexGrow={1} width="100%">
                    {analysisRunning && (
                        <Text size="1" color="gray">
                            <Text as="span" weight="medium">{t('Analyzing')}:</Text> {analysisCurrentPath}
                        </Text>
                    )}
                    {backupRunning && (
                        <Progress value={backupProgressPercent} size="3" color="blue" />
                    )}
                </Flex>
                <Flex align="center" gapX="2">
                    <Flex align="center" justify="start" gapX="1" style={{ whiteSpace: 'nowrap' }}>
                        <Text size="1" color="gray">
                            {`${stepsRemaining} ${stepsRemaining > 1 ? t('actions') : t('action')}`}
                        </Text>
                    </Flex>
                    <Separator orientation="vertical" size="1" />
                    <Flex align="center" justify="start" gapX="1" style={{ whiteSpace: 'nowrap' }}>
                        <Text size="1" color="gray">
                            {bytesRemaining}
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};
