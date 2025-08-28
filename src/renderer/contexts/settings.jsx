// Requirements
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';


// Constants
const initialSettings = {};


// Variables
const Context = createContext({});


// Exported
export const SettingsContext = ({ children }) => {
    const [settings, setSettings] = useState(initialSettings);

    useEffect(() => {
        const doLoad = async () => {
            const loaded = await window.api.settingsRead();
            setSettings(prev => ({ ...prev, ...loaded }));
        };
        doLoad();
    }, []);

    const state = useMemo(() => ({
        settings,
        setSettings,
    }),
    [settings]);

    return (
        <Context.Provider value={state}>
            {children}
        </Context.Provider>
    );
};


export const useSettings = () => {
    const { settings, setSettings } = useContext(Context);

    const saveSettings = useCallback(async (newSettings) => {
        const updatedSettings = { ...settings, ...newSettings };
        await window.api.settingsWrite(updatedSettings);
        setSettings(updatedSettings);
    }, [settings, setSettings]);

    return { settings, saveSettings };
};
