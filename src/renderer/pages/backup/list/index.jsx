// Requirements
import { Flex, ScrollArea, Text } from '@radix-ui/themes';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useBackup } from '../../../contexts/backup/index.jsx';
import { useI18n } from '../../../contexts/i18n.jsx';
import Row from './row.jsx';


// Exported
export default ({ autoScroll }) => {
    const { t } = useI18n();
    const { analysisRequested, analysisCompleted, plan, planProgress } = useBackup();

    const scrollAreaRef = useRef(null);
    const rowRefs = useRef({});

    // Variables
    const filteredSteps = useMemo(() => plan.filter(step => planProgress[step.relativePath]), [plan, planProgress]);

    const scrollToActiveItem = useCallback(() => {
        if (!autoScroll || !scrollAreaRef.current) return;

        // During backup: scroll to processing item
        const processingStep = filteredSteps.find((step) => {
            const progress = planProgress[step.relativePath];
            return progress && progress.stepProcessing && !progress.stepDone;
        });

        if (processingStep && rowRefs.current[processingStep.relativePath]) {
            const element = rowRefs.current[processingStep.relativePath];
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            return;
        }

        // During analysis or when no processing item: scroll to last item
        if (filteredSteps.length > 0) {
            const lastStep = filteredSteps[filteredSteps.length - 1];
            if (rowRefs.current[lastStep.relativePath]) {
                const element = rowRefs.current[lastStep.relativePath];
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                });
            }
        }
    }, [autoScroll, filteredSteps, planProgress]);

    useEffect(() => {
        scrollToActiveItem();
    }, [scrollToActiveItem]);

    if (analysisRequested && analysisCompleted && plan.length === 0) {
        return (
            <Flex align="center" justify="center" flexGrow={1}>
                <Text size="1" color="gray">{t('No differences found')}</Text>
            </Flex>
        );
    }

    return (
        <ScrollArea ref={scrollAreaRef} style={{ flex: 1 }}>
            {filteredSteps.map(step => (
                <Row
                    key={step.relativePath}
                    ref={(el) => { if (el) rowRefs.current[step.relativePath] = el; }}
                    p={planProgress[step.relativePath]}
                />
            ))}
        </ScrollArea>
    );
};
