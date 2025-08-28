// Requirements
import { GearIcon } from '@radix-ui/react-icons';
import { Dialog, Flex, IconButton, Select, Text } from '@radix-ui/themes';
import { useI18n } from '../../contexts/i18n.jsx';


// Constants
const languageName = {
    es: 'Español',
    en: 'English',
};


// Exported
export default () => {
    const { t, language, changeLanguage, availableLanguages } = useI18n();
    return (
        <Dialog.Root>
            <Dialog.Trigger>
                <IconButton variant="ghost" size="1" radius="full">
                    <GearIcon width="16" height="16" color="gray" />
                </IconButton>
            </Dialog.Trigger>

            <Dialog.Content maxWidth="420px">
                <Dialog.Title>
                    {t('Settings')}
                </Dialog.Title>
                <Dialog.Description size="1" color="gray">
                    {t('Configure application preferences.')}
                </Dialog.Description>
                <Flex direction="column" gap="3" pt="2">
                    <Flex align="center" justify="between" gap="3">
                        <Text size="2">
                            {t('Language')}
                        </Text>
                        <Select.Root value={language} onValueChange={changeLanguage}>
                            <Select.Trigger size="2" />
                            <Select.Content>
                                {availableLanguages.map(code => (
                                    <Select.Item key={code} value={code}>
                                        {languageName[code]}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Flex>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

