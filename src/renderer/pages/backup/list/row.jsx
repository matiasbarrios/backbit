// Requirements
import { Button, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { useCallback, useMemo } from 'react';
import { CheckIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { useI18n } from '../../../contexts/i18n.jsx';
import { useBackup } from '../../../contexts/backup/index.jsx';


// Constants
const progressBackroundStyle = {
    width: '120px',
    height: '6px',
    backgroundColor: 'var(--gray-4)',
    borderRadius: '999px',
    overflow: 'hidden',
};


// Internal
const ActionButton = ({ p }) => {
    const { step } = p;

    const { t } = useI18n();
    const { source, destination, backupRunning, backupSingleStepRun } = useBackup();

    const onActionRun = useCallback(async () => {
        if (p.stepDone || backupRunning || p.stepProcessing) return;
        await backupSingleStepRun(source, destination, step);
    }, [p, step, backupRunning, source, destination, backupSingleStepRun]);

    const color = useMemo(() => {
        if (p.stepDone) return 'gray';
        if (p.stepCancelled) return 'gray';
        if (p.stepProcessing) return 'gray';
        if (step.action === 'copy' && !step.toAdd) return 'yellow';
        if (step.action === 'copy' && step.toAdd) return 'green';
        if (step.action === 'delete') return 'red';
        return 'gray';
    }, [p, step]);

    const text = useMemo(() => {
        if (p.stepCancelled) return t('cancelled');

        if (p.stepProcessing) {
            const percent = p.stepCopiedBytes && step.sourceSize
                ? Math.min(100, Math.floor((p.stepCopiedBytes / step.sourceSize) * 100))
                : 0;
            return `${t('copying')} ${percent}%`;
        }

        if (p.stepDone && step.action === 'copy' && step.toAdd) return t('added');
        if (p.stepDone && step.action === 'copy' && !step.toAdd) return t('updated');
        if (p.stepDone && step.action === 'delete') return t('deleted');

        if (step.action === 'copy' && step.toAdd) return t('to add');
        if (step.action === 'copy' && !step.toAdd) return t('to update');
        if (step.action === 'delete') return t('to delete');

        return '';
    }, [p, step, t]);

    const tooltip = useMemo(() => {
        if (p.stepProcessing || p.stepDone || p.stepCancelled) return null;
        if (step.action === 'copy' && !step.toAdd) {
            let details = '';
            if (step.sizeDiffers) {
                details += `${t('size')}`;
                if (step.mtimeDiffers) {
                    details += ` + ${t('date')}`;
                }
            } else if (step.mtimeDiffers) {
                details += `${t('date')}`;
            }
            return details || null;
        }
        return null;
    }, [p, step, t]);

    if (p.stepProcessing) return null;

    if (p.stepDone) return (
        <Flex align="center" gapX="1" py="1">
            <Text size="1" color="gray">{text}</Text>
            <CheckIcon width={12} height={12} />
        </Flex>
    );

    if (tooltip) {
        return (
            <Tooltip content={tooltip}>
                <Button variant="soft" color={color} onClick={onActionRun} size="1">
                    {text}
                </Button>
            </Tooltip>
        );
    }

    return (
        <Button variant="soft" color={color} onClick={onActionRun} size="1">
            {text}
        </Button>
    );
};


const ProcessingProgress = ({ p }) => {
    const { step } = p;

    const progressPercentage = useMemo(() =>
        p.stepCopiedBytes && step.sourceSize
            ? Math.min(100, Math.floor((p.stepCopiedBytes / step.sourceSize) * 100))
            : 0,
    [p.stepCopiedBytes, step.sourceSize]);

    const progressStyle = useMemo(() => ({
        width: `${progressPercentage}%`,
        height: '100%',
        backgroundColor: 'var(--blue-9)',
        transition: 'width 0.1s linear',
    }), [progressPercentage]);

    if (!p.stepProcessing || !step.sourceSize) return null;

    return (
        <div style={progressBackroundStyle} >
            <div style={progressStyle} />
        </div>
    );
};


// Exported
export default ({ p }) => {
    const { step } = p;

    const { source } = useBackup();

    const handlePathClick = useCallback(async () => {
        if (!source) return;
        await window.api.foldersRevealInOrigin(source, step.relativePath);
    }, [source, step.relativePath]);

    return (
        <Flex align="center" justify="between" px="4">
            <Flex align="center" justify="between" gapX="2" width="100%" py="1">
                <Flex align="center" gapX="2">
                    <IconButton variant="ghost" color="gray" onClick={handlePathClick} radius="full" size="1">
                        <ExternalLinkIcon width={12} height={12} />
                    </IconButton>
                    <Text size="1" color="gray">
                        {step.relativePath}
                    </Text>
                </Flex>
                <Flex align="center" gapX="2" style={{ minHeight: '24px', maxHeight: '24px' }}>
                    <ProcessingProgress p={p} />
                    <ActionButton p={p} />
                </Flex>
            </Flex>
        </Flex>
    );
};
