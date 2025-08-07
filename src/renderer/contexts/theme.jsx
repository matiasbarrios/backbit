// Requirements
import { Theme } from '@radix-ui/themes';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import useSettings from '../hooks/useSettings';


// Variables
const Context = createContext({});


// Internal
const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';


// Exported
export const ThemeContext = ({ children }) => {
    const systemTheme = useMemo(getCurrentTheme, []);
    const [theme, setTheme] = useState(systemTheme);
    const { settings, saveSettings } = useSettings();

    const state = useMemo(() => ({
        theme,
        setTheme,
    }),
    [theme]);

    useEffect(() => {
        if (settings?.theme) {
            setTheme(settings.theme);
        }
    }, [settings?.theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handler = (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
            if (settings?.theme) {
                saveSettings({ theme: newTheme });
            }
        };

        mediaQuery.addEventListener('change', handler);

        return () => {
            mediaQuery.removeEventListener('change', handler);
        };
    }, [settings?.theme, saveSettings]);

    return (
        <Context.Provider value={state}>
            <Theme
                accentColor="gray"
                grayColor="mauve"
                appearance={theme}
                hasBackground={false}
            >
                {children}
            </Theme>
        </Context.Provider>
    );
};


export const useTheme = () => {
    const { theme, setTheme } = useContext(Context);
    const { saveSettings } = useSettings();

    const themeToggle = useCallback(async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        await saveSettings({ theme: newTheme });
    }, [theme, setTheme, saveSettings]);

    return { theme, themeToggle };
};
