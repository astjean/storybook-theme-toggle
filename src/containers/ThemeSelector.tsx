import React, { Component, Fragment, ReactElement } from 'react';
import memoize from 'memoizerific';

import { Combo, Consumer, API } from '@storybook/api';
import { Global, Theme as ThemeStyle } from '@storybook/theming';
import { logger } from '@storybook/client-logger';

import { IconButton, WithTooltip, TooltipLinkList } from '@storybook/components';

import { PARAM_KEY as THEMES_PARAM_KEY, EVENTS } from '../constants';
import { ColorIcon } from '../components/ColorIcon';
import Palette from '../icons/Palette';

interface GlobalState {
  name: string | undefined;
  selected: string | undefined;
}

interface Props {
  api: API;
}

interface ThemeSelectorItem {
  id: string;
  title: string;
  onClick: () => void;
  value: string;
  right?: ReactElement;
}

interface Theme {
  name: string;
  value: string;
}

interface ThemesParameter {
  default?: string;
  disable?: boolean;
  values: Theme[];
}

interface ThemesConfig {
  themes: Theme[] | null;
  selectedTheme: string | null;
  defaultThemeName: string | null;
  disable: boolean;
}

const iframeId = 'storybook-preview-iframe';

const createThemeSelectorItem = memoize(1000)(
  (
    id: string,
    name: string,
    value: string,
    hasSwatch: boolean,
    change: (arg: { selected: string; name: string }) => void
  ): ThemeSelectorItem => ({
    id: id || name,
    title: name,
    onClick: () => {
      change({ selected: value, name });
    },
    value,
    right: hasSwatch ? <ColorIcon background={value} /> : undefined,
  })
);

const getDisplayedItems = memoize(10)(
  (
    themes: Theme[],
    selectedThemeColor: string | null,
    change: (arg: { selected: string; name: string }) => void
  ) => {
    const themeSelectorItems = themes.map(({ name, value }) =>
      createThemeSelectorItem(null, name, value, true, change)
    );

    if (selectedThemeColor !== 'transparent') {
      return [
        createThemeSelectorItem('reset', 'Clear theme', 'transparent', null, change),
        ...themeSelectorItems,
      ];
    }

    return themeSelectorItems;
  }
);

const getSelectedThemeColor = (
  themes: Theme[] = [],
  currentSelectedValue: string,
  defaultName: string
): string => {
  if (currentSelectedValue === 'transparent') {
    return 'transparent';
  }

  if (themes.find((theme) => theme.value === currentSelectedValue)) {
    return currentSelectedValue;
  }

  const defaultTheme = themes.find((theme) => theme.name === defaultName);
  if (defaultTheme) {
    return defaultTheme.value;
  }

  if (defaultName) {
    const availableColors = themes.map((theme) => theme.name).join(', ');
    logger.warn(
      `Themes Addon: could not find the default color "${defaultName}".
      These are the available colors for your story based on your configuration: ${availableColors}`
    );
  }

  return 'transparent';
};

const getThemesConfig = ({ api, state }: Combo): ThemesConfig => {
  const themesParameter = api.getCurrentParameter<ThemesParameter>(THEMES_PARAM_KEY);
  const selectedThemeValue = state.addons[THEMES_PARAM_KEY] || null;

  if (Array.isArray(themesParameter)) {
    logger.warn(
      'Addon Themes api has changed in Storybook 6.0. Please refer to the migration guide: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md'
    );
  }

  const isThemesEmpty = !themesParameter?.values?.length;
  if (themesParameter?.disable || isThemesEmpty) {
    // other null properties are necessary to keep the same return shape for Consumer memoization
    return {
      disable: true,
      themes: null,
      selectedTheme: null,
      defaultThemeName: null,
    };
  }

  return {
    disable: false,
    themes: themesParameter?.values,
    selectedTheme: selectedThemeValue,
    defaultThemeName: themesParameter?.default,
  };
};

export class ThemeSelector extends Component<Props> {
  change = ({ selected, name }: GlobalState) => {
    const { api } = this.props;
    if (typeof selected === 'string') {
      api.setAddonState<string>(THEMES_PARAM_KEY, selected);
    }
    api.emit(EVENTS.UPDATE, { selected, name });
  };

  render() {
    return (
      <Consumer filter={getThemesConfig}>
        {({
          disable,
          themes,
          selectedTheme,
          defaultThemeName,
        }: ThemesConfig) => {
          if (disable) {
            return null;
          }

          const selectedThemeColor = getSelectedThemeColor(
            themes,
            selectedTheme,
            defaultThemeName
          );

          return (
            <Fragment>
              {selectedThemeColor ? (
                <Global
                  styles={(theme: ThemeStyle) => ({
                    [`#${iframeId}`]: {
                      theme:
                        selectedThemeColor === 'transparent'
                          ? theme.background.content
                          : selectedThemeColor,
                    },
                  })}
                />
              ) : null}
              <WithTooltip
                placement="top"
                trigger="click"
                closeOnClick
                tooltip={({ onHide }) => (
                  <TooltipLinkList
                    links={getDisplayedItems(themes, selectedThemeColor, (i) => {
                      this.change(i);
                      onHide();
                    })}
                  />
                )}
              >
                <IconButton
                  key="theme-toggle"
                  title="Toggle theme"
                  active={selectedThemeColor !== 'transparent'}
                >
                  <Palette />
                </IconButton>
              </WithTooltip>
            </Fragment>
          );
        }}
      </Consumer>
    );
  }
}