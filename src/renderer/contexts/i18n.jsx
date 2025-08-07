// Requirements
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import useSettings from '../hooks/useSettings.js';


// Constants
const Context = createContext();

const messages = {
    es: {
        title: 'BackBit',
        subtitle:
			'Sincroniza una carpeta de origen hacia una de destino (modo backup)',
        origin: 'Origen',
        pick: 'Elegir',
        destination: 'Destino',
        analyze: 'Analizar',
        cancelAnalyze: 'Cancelar análisis',
        sync: 'Sincronizar',
        cancelSync: 'Cancelar sync',
        actions: 'Acciones:',
        toCopy: 'A copiar:',
        autoScroll: 'Auto-scroll',
        analyzing: 'Analizando…',
        copy: 'Agregar',
        update: 'Actualizar',
        delete: 'Eliminar',
        copying: 'Copiando',
        deleting: 'Eliminando…',
        copied: 'Copiado',
        deleted: 'Eliminado',
        analyzingOrigin: 'Analizando origen:',
        analyzingDest: 'Analizando destino:',
        chooseFromHistory: 'Elegí origen usado…',
        pickPlaceholder: 'Elegí carpeta...',
        settings: 'Configuración',
        language: 'Idioma',
        settingsDescription: 'Configura las preferencias de la aplicación.',
    },
    en: {
        title: 'BackBit',
        subtitle: 'Sync source folder to destination (backup mode)',
        origin: 'Source',
        pick: 'Pick',
        destination: 'Destination',
        analyze: 'Analyze',
        cancelAnalyze: 'Cancel analyze',
        sync: 'Sync',
        cancelSync: 'Cancel sync',
        actions: 'Actions:',
        toCopy: 'To copy:',
        autoScroll: 'Auto-scroll',
        analyzing: 'Analyzing…',
        copy: 'Add',
        update: 'Update',
        delete: 'Delete',
        copying: 'Copying',
        deleting: 'Deleting…',
        copied: 'Copied',
        deleted: 'Deleted',
        analyzingOrigin: 'Analyzing source:',
        analyzingDest: 'Analyzing destination:',
        chooseFromHistory: 'Choose used source…',
        pickPlaceholder: 'Pick a folder...',
        settings: 'Settings',
        language: 'Language',
        settingsDescription: 'Configure application preferences.',
    },
    pt: {
        title: 'BackBit',
        subtitle: 'Sincroniza a pasta de origem para o destino (modo backup)',
        origin: 'Origem',
        pick: 'Escolher',
        destination: 'Destino',
        analyze: 'Analisar',
        cancelAnalyze: 'Cancelar análise',
        sync: 'Sincronizar',
        cancelSync: 'Cancelar sync',
        actions: 'Ações:',
        toCopy: 'A copiar:',
        autoScroll: 'Auto-scroll',
        analyzing: 'Analisando…',
        copy: 'Adicionar',
        update: 'Atualizar',
        delete: 'Excluir',
        copying: 'Copiando',
        deleting: 'Excluindo…',
        copied: 'Copiado',
        deleted: 'Excluído',
        analyzingOrigin: 'Analisando origem:',
        analyzingDest: 'Analisando destino:',
        chooseFromHistory: 'Escolher origem usada…',
        pickPlaceholder: 'Escolher pasta...',
        settings: 'Configurações',
        language: 'Idioma',
        settingsDescription: 'Configure as preferências do aplicativo.',
    },
};


// Internal
const useI18nLogic = () => {
    const { settings, saveSettings } = useSettings();
    const [currentLang, setCurrentLang] = useState('es');

    const availableLanguages = useMemo(() => Object.keys(messages), []);

    const systemLang = useMemo(() => {
        const lang = typeof navigator !== 'undefined' && navigator.language
            ? navigator.language.split('-')[0]
            : 'en';
        return lang;
    }, []);

    // Load language from settings or system on mount / when settings change
    useEffect(() => {
        const fromSettings = settings?.lang;
        const fallback = availableLanguages.includes(systemLang) ? systemLang : 'en';
        const resolved = fromSettings || fallback;
        setCurrentLang(resolved);
    }, [settings?.lang, systemLang, availableLanguages]);

    const changeLang = useCallback(async (newLang) => {
        setCurrentLang(newLang);
        await saveSettings({ lang: newLang });
    },
    [saveSettings]);

    const t = useCallback(key => messages[currentLang]?.[key] || key,
        [currentLang]);

    return useMemo(() => ({
        currentLang,
        changeLang,
        t,
        availableLanguages,
    }),
    [currentLang, changeLang, t, availableLanguages]);
};


// Exported
export const I18nContext = ({ children }) => {
    const i18n = useI18nLogic();

    return <Context.Provider value={i18n}>{children}</Context.Provider>;
};


export const useI18n = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
