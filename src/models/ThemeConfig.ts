import { Theme } from './Theme';

export interface ThemeConfig {
  clearable?: boolean,
  list: Theme[],
  onChange?: (themeName: Theme) => void
}
