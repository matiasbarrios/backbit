// Requirements
import { Flex, ScrollArea, Text } from '@radix-ui/themes';
import { useBackup } from '../../../contexts/backup/index.jsx';
import { useI18n } from '../../../contexts/i18n.jsx';
import Row from './row.jsx';


// Exported
export default () => {
    const { t } = useI18n();
    const { analysisRequested, analysisCompleted, plan, planProgress } = useBackup();

    if (analysisRequested && analysisCompleted && plan.length === 0) {
        return (
            <Flex align="center" justify="center" flexGrow={1}>
                <Text size="1" color="gray">{t('No differences found')}</Text>
            </Flex>
        );
    }

    return (
        <ScrollArea style={{ flex: 1 }}>
            {plan
                .filter(step => planProgress[step.relativePath])
                .map(step => <Row key={step.relativePath} p={planProgress[step.relativePath]} />)}
        </ScrollArea>
    );
};
