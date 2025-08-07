// Requirements
import { useCallback, useEffect, useState } from 'react';


// Exported
const useSettings = () => {
    const [settings, setSettings] = useState({});

    const loadSettings = useCallback(async () => {
        try {
            const loadedSettings = await window.api.getSettings();
            if (loadedSettings) {
                setSettings(prevSettings => ({ ...prevSettings, ...loadedSettings }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }, []);

    const saveSettings = useCallback(async (newSettings) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            await window.api.setSettings(updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },
    [settings]);

    useEffect(() => {
        loadSettings();
    }, []);

    return { settings, saveSettings };
};


export default useSettings;
