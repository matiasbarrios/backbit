// Requirements
import { useCallback, useMemo } from 'react';

// Exported
const useFolders = () => {
    const pickFolder = useCallback(async () => {
        try {
            return await window.api.pickFolder();
        } catch (error) {
            console.error('Error picking folder:', error);
            return null;
        }
    }, []);

    const revealInOrigin = useCallback(async (srcDir, relativePath) => {
        try {
            await window.api.revealInOrigin(srcDir, relativePath);
        } catch (error) {
            console.error('Error revealing file:', error);
        }
    }, []);

    const loadFolderPairs = useCallback(async () => {
        try {
            const pairs = await window.api.listPairs();
            return pairs || [];
        } catch (error) {
            console.error('Error loading folder pairs:', error);
            return [];
        }
    }, []);

    const deletePair = useCallback(async (srcDir, dstDir) => {
        try {
            await window.api.deletePair(srcDir, dstDir);
            return true;
        } catch (error) {
            console.error('Error deleting folder pair:', error);
            return false;
        }
    }, []);

    return useMemo(() => ({
        pickFolder,
        revealInOrigin,
        loadFolderPairs,
        deletePair,
    }),
    [pickFolder, revealInOrigin, loadFolderPairs, deletePair]);
};

export default useFolders;
