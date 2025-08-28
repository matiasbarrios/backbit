// Requirements
import { Flex } from '@radix-ui/themes';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackup } from '../../contexts/backup/index.jsx';
import { navbarHeight } from '../../components/navbar.jsx';
import Actions from './actions.jsx';
import Progress from './progress.jsx';
import List from './list/index.jsx';


// Constants
const height = `calc(100dvh - ${navbarHeight}px)`;


// Exported
export default () => {
    const navigate = useNavigate();
    const { source, destination } = useBackup();

    useEffect(() => {
        if (!source || !destination) navigate('/');
    }, [source, destination, navigate]);

    if (!source || !destination) return null;

    return (
        <Flex direction="column" align="center" justify="start" pt="2" pb="4" gapY="3" style={{ minHeight: height, maxHeight: height }}>
            <Actions />
            <Progress />
            <List />
        </Flex>
    );
};
