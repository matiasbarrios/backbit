// Requirements
import { ArrowLeftIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { Box, Flex, IconButton } from '@radix-ui/themes';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/theme';
import Settings from '../settings.jsx';


// Constants
const navbarHeight = 48;


// Exported
export { navbarHeight };

export default ({ navbarAlwaysOn = false }) => {
    const { theme, themeToggle } = useTheme();
    const [scrolled, setScrolled] = useState(!!navbarAlwaysOn);
    const { pathname } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (navbarAlwaysOn) return () => {};

        const handleScroll = () => {
            setScrolled(window.scrollY > navbarHeight);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [navbarAlwaysOn]);

    const navbarStyle = useMemo(() => ({
        position: 'fixed',
        top: 0,
        width: '100dvw',
        height: `${navbarHeight}px`,
        zIndex: 50,
        transition: 'border-bottom 0.3s ease-in-out',
        borderBottom: scrolled
            ? '0px solid var(--gray-a6)'
            : '0px solid var(--gray-a1)',
        backgroundColor: 'var(--color-background)',
    }),
    [scrolled]);

    return (
        <Box asChild style={navbarStyle}>
            <Flex align="center" justify="between" py="2" px="5" gap="3">
                <Flex align="center" justify="start">
                    {pathname !== '/' && (
                        <IconButton variant="ghost" size="1" radius="full" onClick={() => navigate('/') }>
                            <ArrowLeftIcon width="16" height="16" />
                        </IconButton>
                    )}
                </Flex>

                <Flex align="center" justify="end" gap="3">
                    <Settings />

                    <IconButton variant="ghost" size="1" radius="full" onClick={themeToggle}>
                        {theme === 'light' && (
                            <SunIcon width="16" height="16" color="gray" />
                        )}
                        {theme === 'dark' && (
                            <MoonIcon width="16" height="16" color="gray" />
                        )}
                    </IconButton>
                </Flex>
            </Flex>
        </Box>
    );
};
