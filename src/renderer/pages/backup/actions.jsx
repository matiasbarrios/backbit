// Requirements
import { Button, Flex, Text } from '@radix-ui/themes';
import { useCallback, useMemo } from 'react';
import { ReloadIcon, StopIcon } from '@radix-ui/react-icons';
import { useBackup } from '../../contexts/backup/index.jsx';
import { useI18n } from '../../contexts/i18n.jsx';


// Exported
export default () => {
    const { t } = useI18n();
    const {
        source, destination,
        analysisRunning, analysisCompleted, analysisRestart, analysisCancel,
        plan, planProgress,
        backupCancel, backupStart, backupRunning,
    } = useBackup();

    const backupReady = useMemo(() => plan.length > 0 && !backupRunning,
        [plan.length, backupRunning]);

    const handleBackup = useCallback(async () => {
        if (plan.length === 0) return;
        const remaining = plan.filter((p) => {
            const entry = planProgress[p.relativePath];
            return entry && !entry.stepDone;
        });

        if (remaining.length === 0) return;
        await backupStart(source, destination, remaining);
    }, [source, destination, plan, planProgress, backupStart]);

    return (
        <Flex direction={{ initial: 'column', xs: 'row' }} align="center" justify="between" gapX="6" width="100%" gapY="4" px="4">
            <Flex direction="column" gapY="1">
                <Text size="1" color="gray">
                    <Text as="span" weight="medium">{t('From')}:</Text> {source}
                </Text>
                <Text size="1" color="gray">
                    <Text as="span" weight="medium">{t('To')}:</Text> {destination}
                </Text>
            </Flex>

            <Flex gap="2">
                {!analysisRunning && (
                    <Button onClick={analysisRestart} size="2" color="blue" variant="soft">
                        <ReloadIcon width={12} height={12} />
                        {t('Update')}
                    </Button>
                )}
                {analysisRunning && (
                    <Button variant="soft" onClick={analysisCancel} size="2" color="red">
                        <StopIcon width={12} height={12} />
                        {t('Stop analysis')}
                    </Button>
                )}
                {analysisCompleted && plan.length > 0 && !backupRunning && (
                    <Button disabled={!backupReady} onClick={handleBackup} size="2" color="blue">
                        {t('Backup')}
                    </Button>
                )}
                {backupRunning && (
                    <Button variant="soft" onClick={backupCancel} size="2" color="red">
                        <StopIcon width={12} height={12} />
                    </Button>
                )}
            </Flex>
        </Flex>
    );
};
