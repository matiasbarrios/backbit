// Requirements
import { Container, Flex, ScrollArea } from '@radix-ui/themes';
import { useLocation } from 'react-router-dom';
import Navbar, { navbarHeight } from './navbar';


// Constants
const height = `calc(100dvh - ${navbarHeight}px)`;


// Exported
export default ({ children }) => {
    const location = useLocation();
    return (
        <>
            <Navbar navbarAlwaysOn />
            <Flex style={{ paddingTop: `${navbarHeight}px` }}>
                <ScrollArea
                    key={location.key || location.pathname}
                    scrollbars="vertical"
                    style={{
                        height,
                        flex: 1,
                        width: '100%',
                    }}
                >
                    <Container size="4" px="5" style={{ maxWidth: '100dvw' }}>
                        <Flex direction="column" align="start" justify="start" style={{ minHeight: height }}>
                            {children}
                        </Flex>
                    </Container>
                </ScrollArea>
            </Flex>
        </>
    );
};
