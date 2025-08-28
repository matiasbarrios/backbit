// Requirements
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import '@radix-ui/themes/styles.css';
import routes from './routes/index.jsx';
import Layout from './components/layout.jsx';
import { I18nContext } from './contexts/i18n.jsx';
import { BackupContext } from './contexts/backup/index.jsx';
import { ThemeContext } from './contexts/theme.jsx';
import { SettingsContext } from './contexts/settings.jsx';
import { HistoryContext } from './contexts/history.jsx';


// Internal
const getElement = r => (
    <Layout>
        {r.element}
    </Layout>
);


// Exported
export default () => (
    <Router>
        <SettingsContext>
            <I18nContext>
                <HistoryContext>
                    <ThemeContext>
                        <BackupContext>
                            <Routes>
                                {routes.map(r => <Route key={r.route} path={r.route} element={getElement(r)}/>)}
                            </Routes>
                        </BackupContext>
                    </ThemeContext>
                </HistoryContext>
            </I18nContext>
        </SettingsContext>
    </Router>
);
