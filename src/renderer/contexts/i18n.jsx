// Requirements
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useSettings } from './settings';


// Constants
const Context = createContext();

const messages = {
    es: {
        Analyzing: 'Analizando',
        'Stop analysis': 'Detener análisis',
        Update: 'Actualizar',
        Backup: 'Respaldar',
        Settings: 'Configuración',
        Language: 'Idioma',
        'Configure application preferences.': 'Configura las preferencias de la aplicación.',
        'Select folders to analyze': 'Elegir carpetas a analizar',
        From: 'Desde',
        To: 'Hacia',
        actions: 'acciones',
        action: 'acción',
        'To copy': 'A copiar',
        'Auto-scroll': 'Auto-scroll',
        Select: 'Seleccionar',
        Delete: 'Eliminar',
        add: 'agregar',
        update: 'actualizar',
        updated: 'actualizado',
        delete: 'eliminar',
        deleted: 'eliminado',
        added: 'agregado',
        copying: 'copiando',
        cancelled: 'cancelado',
        size: 'tamaño',
        date: 'fecha',
        'No differences found': 'No se encontraron diferencias',
        'to add': 'a agregar',
        'to update': 'a actualizar',
        'to delete': 'a eliminar',
    },
    en: {
        Analyzing: 'Analyzing',
        'Stop analysis': 'Stop analysis',
        Update: 'Update',
        Backup: 'Backup',
        Settings: 'Settings',
        Language: 'Language',
        'Configure application preferences.': 'Configure application preferences.',
        'Select folders to analyze': 'Select folders to analyze',
        From: 'From',
        To: 'To',
        actions: 'actions',
        action: 'action',
        'To copy': 'To copy',
        'Auto-scroll': 'Auto-scroll',
        Select: 'Select',
        Delete: 'Delete',
        add: 'add',
        update: 'update',
        updated: 'updated',
        delete: 'delete',
        deleted: 'deleted',
        added: 'added',
        copying: 'copying',
        cancelled: 'cancelled',
        size: 'size',
        date: 'date',
        'No differences found': 'No differences found',
        'to add': 'to add',
        'to update': 'to update',
        'to delete': 'to delete',
    },
};

const defaultLang = 'en';

const availableLanguages = Object.keys(messages);


// Exported
export const I18nContext = ({ children }) => {
    const { settings: { language: settingsLanguage } } = useSettings();

    const [language, setLanguage] = useState(defaultLang);

    useEffect(() => {
        if (settingsLanguage) {
            setLanguage(settingsLanguage);
            return;
        }
        const systemLang = typeof navigator !== 'undefined' && navigator.language
            ? navigator.language.split('-')[0]
            : defaultLang
        const res = availableLanguages.includes(systemLang) ? systemLang : defaultLang;
        setLanguage(res);
    }, [settingsLanguage]);

    const state = useMemo(() => ({
        language,
        setLanguage,
    }),
    [language]);

    return <Context.Provider value={state}>{children}</Context.Provider>;
};


export const useI18n = () => {
    const { language, setLanguage } = useContext(Context);
    const { saveSettings } = useSettings();

    const changeLanguage = useCallback(async (n) => {
        setLanguage(n);
        await saveSettings({ language: n });
    }, [saveSettings, setLanguage]);

    const t = useCallback(key => messages[language]?.[key] || key, [language]);

    return { t, language, changeLanguage, availableLanguages };
};
