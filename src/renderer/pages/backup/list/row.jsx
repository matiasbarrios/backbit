// Requirements
import { Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { CheckIcon, ExternalLinkIcon, PlusIcon, CopyIcon, TrashIcon } from '@radix-ui/react-icons';
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
        if (p.stepProcessing) return 'gray';
        if (step.action === 'copy' && !step.toAdd) return 'yellow';
        if (step.action === 'copy' && step.toAdd) return 'green';
        if (step.action === 'delete') return 'red';
        return 'gray';
    }, [p, step]);

    const text = useMemo(() => {
        if (p.stepProcessing) {
            const percent = p.stepCopiedBytes && step.sourceSize
                ? Math.min(100, Math.floor((p.stepCopiedBytes / step.sourceSize) * 100))
                : 0;
            return `${t('copying')} ${percent}%`;
        }

        if (p.stepDone && step.action === 'copy' && step.toAdd) return t('Added');
        if (p.stepDone && step.action === 'copy' && !step.toAdd) return t('Replaced');
        if (p.stepDone && step.action === 'delete') return t('Deleted');

        return '';
    }, [p, step, t]);

    const actionIcon = useMemo(() => {
        if (step.action === 'copy' && step.toAdd) return <PlusIcon width={12} height={12} />;
        if (step.action === 'copy' && !step.toAdd) return <CopyIcon width={12} height={12} />;
        if (step.action === 'delete') return <TrashIcon width={12} height={12} />;
        return null;
    }, [step]);

    const tooltip = useMemo(() => {
        if (p.stepProcessing || p.stepDone || p.stepCancelled) return null;
        if (step.action === 'copy' && !step.toAdd) {
            let details = `${t('Changed')} `;
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

    if (p.stepProcessing && !p.stepDone) return null;

    if (p.stepDone) return (
        <Flex align="center" gapX="1" py="1">
            <Tooltip content={text}>
                <CheckIcon width={12} height={12} />
            </Tooltip>
        </Flex>
    );

    if (tooltip) {
        return (
            <Tooltip content={tooltip}>
                <IconButton variant="soft" color={color} onClick={onActionRun} size="1" radius="full">
                    {actionIcon || text}
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <IconButton variant="soft" color={color} onClick={onActionRun} size="1" radius="full">
            {actionIcon || text}
        </IconButton>
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

    if (!p.stepProcessing || !step.sourceSize || p.stepCancelled || p.stepDone) return null;

    return (
        <div style={progressBackroundStyle} >
            <div style={progressStyle} />
        </div>
    );
};


// Exported
export default forwardRef(({ p }, ref) => {
    const { step } = p;

    const { source, destination } = useBackup();

    const handlePathClick = useCallback(async () => {
        const root = step.action === 'copy' ? source : destination;
        await window.api.foldersRevealInOrigin(root, step.relativePath);
    }, [source, destination, step]);

    const [beingHovered, setBeingHovered] = useState(false);

    const handleRowMouseEnter = useCallback(() => {
        setBeingHovered(true);
    }, []);

    const handleRowMouseLeave = useCallback(() => {
        setBeingHovered(false);
    }, []);

    return (
        <Flex ref={ref} align="center" justify="between" px="4">
            <Flex align="center" justify="between" gapX="2" width="100%" py="1" onMouseEnter={handleRowMouseEnter} onMouseLeave={handleRowMouseLeave}>
                <Flex align="center" gapX="2">
                    <Text size="1" color="gray">
                        {step.relativePath}
                    </Text>
                    <IconButton variant="ghost" color="gray" onClick={handlePathClick} radius="full" size="1" style={{ opacity: beingHovered ? 1 : 0, transition: 'opacity 0.1s ease' }}>
                        <ExternalLinkIcon width={12} height={12} />
                    </IconButton>
                </Flex>
                <Flex align="center" gapX="2" style={{ minHeight: '24px', maxHeight: '24px' }}>
                    <ProcessingProgress p={p} />
                    <ActionButton p={p} />
                </Flex>
            </Flex>
        </Flex>
    );
});
