export interface ThemeSelectorItem {
  id: string;
  title: string;
  onClick: () => void;
  value: string;
  left?: any;
  active: boolean;
}
