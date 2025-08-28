// Requirements
import Select from '../pages/folders/select.jsx';
import Backup from '../pages/backup/index.jsx';


// Constants
export default [
    {
        route: '/',
        element: <Select />,
    },
    {
        route: '/backup',
        element: <Backup />,
    },
];
