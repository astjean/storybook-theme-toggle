import * as React from 'react';
import { IconButton } from '@storybook/components';
import {
  STORY_CHANGED,
  SET_STORIES,
  DOCS_RENDERED
} from '@storybook/core-events';
import { API, useParameter } from '@storybook/api';
import { PARAM_KEY } from './constants';

import Palette from './icons/Palette';
import { WithTooltip } from '@storybook/components';
import { TooltipLinkList } from '@storybook/components';
import memoize from 'memoizerific';

interface ThemeSelectorItem {
  id: string;
  title: string;
  onClick: () => void;
  value: string;
}

interface Theme {
  name: string;
  class: string;
}

interface ThemeStore {
  /** The collection of themes */
  themes: Theme[];
  /** The current theme the storybook is set to */
  current: Theme;
  /** The name of the default theme to apply */
  default: string;
  /** Apply mode to iframe */
  stylePreview: boolean;
}

const defaultParams: Required<Omit<ThemeStore, 'current' | 'default'>> = {
  themes: [],
  stylePreview: true,
};

/** Add the class to an element */
const toggleClass = (el: HTMLElement, theme: Theme, current: Theme) => {
  if (theme) {
    el.classList.add(theme.class);
  }

  if (current) {
    el.classList.remove(current.class);
  }
}

/** Update the preview iframe class */
const updatePreview = (theme: Theme, current: Theme) => {
  const iframe = document.getElementById('storybook-preview-iframe') as HTMLIFrameElement;

  if (!iframe) {
    return;
  }

  const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
  const body = iframeDocument?.body as HTMLBodyElement;

  toggleClass(body, theme, current);
};

/** Update the manager iframe class */
const updateManager = (theme: Theme, current: Theme) => {
  const manager = document.querySelector('body');

  if (!manager) {
    return;
  }

  toggleClass(manager, theme, current)
};

interface DarkModeProps {
  /** The storybook API */
  api: API;
}

/** A toolbar icon to toggle between dark and light themes in storybook */
export const ThemeToggle = ({ api }: DarkModeProps) => {
  const themeParams = useParameter<Partial<ThemeStore>>(PARAM_KEY, defaultParams);
  const { stylePreview } = themeParams;
  let current = themeParams.themes.find(x => x.name === themeParams.default);

  /** Set the theme in storybook, update the local state, and emit an event */
  const setTheme = React.useCallback(
    (theme: Theme) => {
      updateManager(theme, current)

      if (stylePreview) {
        updatePreview(theme, current);
      }
      current = theme;
    },
    [api, stylePreview]
  );

  /** Update the theme settings */
  const updateTheme = React.useCallback(
    (theme?: Theme) => {
      setTheme(theme);
    },
    [setTheme]
  );

  /** Render the current theme */
  const renderTheme = React.useCallback(()  => {
    setTheme(null);
  }, [setTheme])

  /** When storybook params change update the stored themes */
  React.useEffect(() => {
    renderTheme()
  }, [themeParams, renderTheme])

  React.useEffect(() => {
    const channel = api.getChannel();

    channel.on(STORY_CHANGED, renderTheme);
    channel.on(SET_STORIES, renderTheme);
    channel.on(DOCS_RENDERED, renderTheme);

    return () => {
      channel.removeListener(STORY_CHANGED, renderTheme);
      channel.removeListener(SET_STORIES, renderTheme);
      channel.removeListener(DOCS_RENDERED, renderTheme);
    };
  });

  // Storybook's first render doesn't have the global user params loaded so we
  // need the effect to run whenever defaultMode is updated
  React.useEffect(() => {
    if (current) {
      updateTheme(current);
    }
  }, [current, updateTheme]);

  const themeList = [
    { name: 'dark', class: 'dark-cls' },
    { name: 'light', class: 'light-cls' },
    { name: 'twitter', class: 'twitter-cls' },
    { name: 'facebook', class: 'facebook-cls' },
  ];

  const createThemeSelectorItem = memoize(1000)(
    (
      id: string,
      name: string,
      value: string,
      change: (arg: { selected: string; name: string }) => void
    ): ThemeSelectorItem => ({
      id: id || name,
      title: name,
      onClick: () => {
        change({ selected: value, name });
      },
      value
    })
  );

  const getDisplayedItems = memoize(10)(
    (
      themes: Theme[],
      change: (arg: { selected: string; name: string }) => void
    ) => {
      const themeSelectorItems = themes.map(({ name, class: value }) =>
        createThemeSelectorItem(null, name, value, change)
      );
  
      return [
        createThemeSelectorItem('reset', 'Reset Theme', 'transparent', change),
        ...themeSelectorItems,
      ];
    }
  );

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnClick
      tooltip={({ onHide }) => (
        <TooltipLinkList
          links={getDisplayedItems(themeList, (i) => {
            updateTheme({ name: i.name, class: i.selected });
            onHide();
          })}
        />
      )}
    >
      <IconButton
        key="theme-toggle"
        title="Toggle theme"
      >
        <Palette />
      </IconButton>
    </WithTooltip>
  );
};

export default ThemeToggle;
