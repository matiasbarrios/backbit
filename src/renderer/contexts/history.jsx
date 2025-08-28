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
const initialHistory = [];


// Variables
const Context = createContext({});


// Exported
export const HistoryContext = ({ children }) => {
    const [history, setHistory] = useState(initialHistory);

    useEffect(() => {
        const doLoad = async () => {
            const loaded = await window.api.historyRead();
            setHistory(loaded);
        };
        doLoad();
    }, []);

    const state = useMemo(() => ({
        history,
        setHistory,
    }),
    [history]);

    return (
        <Context.Provider value={state}>
            {children}
        </Context.Provider>
    );
};


export const useHistory = () => {
    const { history, setHistory } = useContext(Context);

    const historyAdd = useCallback(async (source, destination) => {
        const id = `${source}-${destination}`;
        if (history.find(h => h.id === id)) return;
        const n = [...history, { id, source, destination }];
        await window.api.historyWrite(n);
        setHistory(n);
    }, [history, setHistory]);

    const historyDelete = useCallback(async (id) => {
        if (!history.find(h => h.id === id)) return;
        const n = history.filter(h => h.id !== id);
        await window.api.historyWrite(n);
        setHistory(n);
    }, [history, setHistory]);

    return {
        history,
        historyAdd,
        historyDelete,
    };
};
