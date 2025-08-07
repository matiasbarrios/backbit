// Requirements
import { Box, Container } from '@radix-ui/themes';
import FolderPicker from './FolderPicker.jsx';
import Header from './Header.jsx';
import ProgressSection from './ProgressSection.jsx';
import ResultsSection from './ResultsSection.jsx';

// Constants
const containerStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    maxWidth: '1080px',
};

const resultsSectionStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
};

// Exported
const MainLayout = () => (
    <Container size="4" style={containerStyle}>
        <Header />

        <Box mb="4">
            <FolderPicker />
        </Box>

        <Box style={resultsSectionStyle}>
            <ResultsSection />
        </Box>

        <ProgressSection />
    </Container>
);

export default MainLayout;
