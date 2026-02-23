import { theme, setTheme } from '../../../stores/settings.store';
import type { Theme } from '../../../stores/settings.store';

export const useThemeSwitcher = () => {
  const handleSelectTheme = (value: Theme) => {
    setTheme(value);
  };

  return { theme, handleSelectTheme };
};
