// Requirements
import { Button, Flex, IconButton, ScrollArea, Table, Text } from '@radix-ui/themes';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useBackup } from '../../contexts/backup/index.jsx';
import { useI18n } from '../../contexts/i18n.jsx';
import { navbarHeight } from '../../components/navbar.jsx';
import { useHistory } from '../../contexts/history.jsx';


// Internal
const History = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { history, historyDelete } = useHistory();
    const { analysisStart } = useBackup();

    const [hoveredKey, setHoveredKey] = useState(null);

    const handleRowMouseEnter = useCallback(h => () => {
        if (h.id === hoveredKey) return;
        setHoveredKey(h.id);
    }, [hoveredKey]);

    const handleRowMouseLeave = useCallback(() => {
        setHoveredKey(null);
    }, []);

    const deleteButtonStyle = useCallback(h => ({
        opacity: hoveredKey === h.id ? 1 : 0,
        transition: 'opacity 120ms ease',
        pointerEvents: hoveredKey === h.id ? 'auto' : 'none',
    }), [hoveredKey]);

    const onHistoryDelete = useCallback(h => (e) => {
        e.stopPropagation();
        historyDelete(h.id);
    }, [historyDelete]);

    const onHistorySelect = useCallback(h => (e) => {
        e.stopPropagation();
        analysisStart(h.source, h.destination);
        navigate('/backup');
    }, [navigate, analysisStart]);

    if (!history.length) return null;

    return (
        <ScrollArea scrollbars="horizontal">
            <Flex direction="column" align="center" my="4" style={{ width: '100%' }}>
                <Table.Root size="1">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell />
                            <Table.ColumnHeaderCell align="center">
                                <Text size="1" color="gray" weight="bold">
                                    {t('From')}
                                </Text>
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell align="center">
                                <Text size="1" color="gray" weight="bold">
                                    {t('To')}
                                </Text>
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {history.map(h => (
                            <Table.Row key={h.id} onMouseEnter={handleRowMouseEnter(h)} onMouseLeave={handleRowMouseLeave}>
                                <Table.Cell align="center" style={{ width: 0 }}>
                                    <Flex align="center" justify="end" height="100%">
                                        <IconButton
                                            aria-label={t('Delete')}
                                            variant="ghost"
                                            color="blue"
                                            radius="full"
                                            onClick={onHistoryDelete(h)}
                                            style={deleteButtonStyle(h)}
                                        >
                                            <Cross2Icon width={12} height={12} />
                                        </IconButton>
                                    </Flex>
                                </Table.Cell>
                                <Table.Cell align="center">
                                    <Text size="1" color="gray" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                        {h.source}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell align="center">
                                    <Text size="1" color="gray" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                        {h.destination}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell align="center" style={{ width: 0 }}>
                                    <Flex align="center" justify="end" height="100%">
                                        <IconButton aria-label={t('Select')} variant="ghost" color="blue" radius="full" onClick={onHistorySelect(h)}>
                                            <ArrowRightIcon width={12} height={12} />
                                        </IconButton>
                                    </Flex>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Flex>
        </ScrollArea>
    );
};


// Exported
export default () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { analysisStart } = useBackup();
    const { historyAdd } = useHistory();

    const [going, setGoing] = useState(false);

    const handleSelectFolders = useCallback(async () => {
        const source = await window.api.folderPick();
        if (!source) return;
        const destination = await window.api.folderPick();
        if (!destination) return;

        setGoing(true);
        navigate('/backup');
        historyAdd(source, destination);
        analysisStart(source, destination);
    }, [navigate, analysisStart, historyAdd]);

    if (going) return null;

    return (
        <Flex direction="column" align="center" justify="center" gapY="2" flexGrow={1} style={{ minHeight: `calc(100dvh - ${navbarHeight}px)` }}>
            <Button size="3" onClick={handleSelectFolders} color="blue">
                {t('Select folders to analyze')}
            </Button>
            <History />
        </Flex>
    );
};
