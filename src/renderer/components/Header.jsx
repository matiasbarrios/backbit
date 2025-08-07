// Requirements
import { Flex, Heading, IconButton, Select, Text } from '@radix-ui/themes';
import { useMemo } from 'react';
import { useI18n } from '../contexts/i18n.jsx';
import { useTheme } from '../contexts/theme.jsx';


// Exported
export default () => {
    const { t, currentLang, changeLang, availableLanguages } = useI18n();
    const { toggleTheme, themeIcon } = useTheme();

    const languageOptions = useMemo(() =>
        availableLanguages.map(lang => (
            <Select.Item key={lang} value={lang}>
                {lang.toUpperCase()}
            </Select.Item>
        )),
    [availableLanguages]);

    return (
        <Flex justify="between" align="end" mb="4" gap="3">
            <Flex direction="column">
                <Heading size="6" mb="1">
                    {t('title')}
                </Heading>
                <Text size="2" color="gray">
                    {t('subtitle')}
                </Text>
            </Flex>

            <Flex align="center" gap="2">
                <Select.Root value={currentLang} onValueChange={changeLang} size="2">
                    <Select.Trigger />
                    <Select.Content>{languageOptions}</Select.Content>
                </Select.Root>

                <IconButton
                    variant="ghost"
                    size="2"
                    onClick={toggleTheme}
                    title={t('toggleTheme') || 'Toggle theme'}
                >
                    {themeIcon}
                </IconButton>
            </Flex>
        </Flex>
    );
};
