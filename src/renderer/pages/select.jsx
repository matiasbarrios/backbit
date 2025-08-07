// Requirements
import { Button, Flex, IconButton, Separator, Text, Tooltip } from '@radix-ui/themes';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useSync } from '../contexts/sync.jsx';
import useFolders from '../hooks/useFolders.js';


// Exported
export default () => {
    const navigate = useNavigate();
    const { state, dispatch } = useSync();
    const { pickFolder, loadFolderPairs, deletePair } = useFolders();

    // Internal
    const hasHistory = useMemo(() => state.folderPairs.length > 0, [state.folderPairs.length]);

    const refreshHistory = useCallback(async () => {
        const pairs = await loadFolderPairs();
        dispatch({ type: 'SET_FOLDER_PAIRS', pairs });
    }, [loadFolderPairs, dispatch]);

    const handleDeletePair = useCallback(async (src, dst) => {
        const ok = await deletePair(src, dst);
        if (ok) refreshHistory();
    }, [deletePair, refreshHistory]);

    const handleSelectFolders = useCallback(async () => {
        const src = await pickFolder();
        if (!src) return;
        const dst = await pickFolder();
        if (!dst) return;

        dispatch({ type: 'SET_PATHS', srcPath: src, dstPath: dst });
        navigate('/main');
    }, [pickFolder, dispatch, navigate]);

    const handleUseHistoryPair = useCallback((pair) => {
        if (!pair) return;
        dispatch({ type: 'SET_PATHS', srcPath: pair.src, dstPath: pair.dst });
        navigate('/main');
    }, [dispatch, navigate]);

    return (
        <Flex direction="column" align="center" justify="center" style={{ height: '100%', width: '100%' }}>
            <Flex direction="column" align="center" justify="center" gap="4" style={{ flex: 1, width: '100%' }}>
                <Button size="4" onClick={handleSelectFolders} style={{ padding: '28px 40px' }}>
                    select folders
                </Button>

                {hasHistory && (
                    <Flex direction="column" align="start" style={{ width: '100%', maxWidth: '980px' }}>
                        <Text size="2" color="gray">latest selections</Text>
                        <Separator my="2" size="4" style={{ width: '100%' }} />
                        <Flex direction="column" gap="2" align="start" style={{ width: '100%' }}>
                            {state.folderPairs.map(pair => (
                                <Flex key={`${pair.src}|${pair.dst}`} align="center" gap="2" style={{ maxWidth: '100%', width: '100%' }}>
                                    <Button variant="ghost" onClick={() => handleUseHistoryPair(pair)} style={{ flex: 1, justifyContent: 'flex-start' }}>
                                        <Text size="2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                            {pair.src}
                                            <Text as="span" color="gray"> → </Text>
                                            {pair.dst}
                                        </Text>
                                    </Button>
                                    <Tooltip content="delete">
                                        <IconButton variant="soft" color="red" onClick={() => handleDeletePair(pair.src, pair.dst)}>
                                            <Cross2Icon />
                                        </IconButton>
                                    </Tooltip>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};
