// Requirements
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import '@radix-ui/themes/styles.css';
import routes from './routes';
import Layout from './components/layout/index.jsx';
import { I18nContext } from './contexts/i18n.jsx';
import { SyncContext } from './contexts/sync.jsx';
import { ThemeContext } from './contexts/theme.jsx';


// Internal
const getElement = r => (
    <Layout>
        {r.element}
    </Layout>
);


// Exported
export default () => (
    <Router>
        <ThemeContext>
            <I18nContext>
                <SyncContext>
                    <Routes>
                        { routes.map(r => (
                            <Route
                                key={r.route}
                                path={r.route}
                                element={getElement(r)}
                            />
                        )) }
                    </Routes>
                </SyncContext>
            </I18nContext>
        </ThemeContext>
    </Router>
);
