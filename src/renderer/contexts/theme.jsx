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
import { useSettings } from './settings';


// Variables
const Context = createContext({});


// Internal
const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';


// Exported
export const ThemeContext = ({ children }) => {
    const systemTheme = useMemo(getCurrentTheme, []);
    const [theme, setTheme] = useState(systemTheme);
    const { settings: { theme: settingsTheme }, saveSettings } = useSettings();

    useEffect(() => {
        if (settingsTheme) {
            setTheme(settingsTheme);
        }
    }, [settingsTheme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handler = (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
            if (settingsTheme) {
                saveSettings({ theme: newTheme });
            }
        };

        mediaQuery.addEventListener('change', handler);

        return () => {
            mediaQuery.removeEventListener('change', handler);
        };
    }, [settingsTheme, saveSettings]);

    const state = useMemo(() => ({
        theme,
        setTheme,
    }),
    [theme]);

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
