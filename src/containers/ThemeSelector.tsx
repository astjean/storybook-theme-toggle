import React, { Component, Fragment } from 'react';
import memoize from 'memoizerific';

import { API } from '@storybook/api';
import { SET_STORIES } from '@storybook/core-events';

import { Icons, IconButton, WithTooltip, TooltipLinkList } from '@storybook/components';

import { CHANGE, THEME } from '../constants';
import { Theme, ThemeSelectorItem } from '../models';
import { getConfigFromApi, getSelectedTheme, getSelectedThemeName } from '../shared';

import { ThemeStory } from './ThemeStory';
import Palette from '../icons/Palette';

const iframeId = 'storybook-preview-iframe';

const createThemeSelectorItem = memoize(1000)(
  (
    id: string,
    title: string,
    color: string,
    hasSwatch: boolean,
    change: (arg: { selected: string; expanded: boolean }) => void,
    active: boolean,
  ): ThemeSelectorItem => ({
    id,
    title,
    onClick: () => {
      change({ selected: id, expanded: false });
    },
    value: id,
    left: hasSwatch ? <Icons icon="paintbrush" style={{
      color: color,
      height: 14,
      width: 14
    }} /> : undefined,
    active,
  })
);

const getDisplayableState = memoize(10)(
  (props: ThemeToolProps, state: ThemeToolState, change) => {
    const { clearable, list } = getConfigFromApi(props.api);
    const selectedThemeName = getSelectedThemeName(list, state.selected);

    let availableThemeSelectorItems: ThemeSelectorItem[] = [];
    let selectedTheme: Theme;

    if (selectedThemeName !== 'none' && clearable) {
      availableThemeSelectorItems.push(
        createThemeSelectorItem('none', 'Clear theme', 'transparent', null, change, false)
      );
    }

    if (list.length) {
      availableThemeSelectorItems = [
        ...availableThemeSelectorItems,
        ...list.map(({ color, name }) =>
          createThemeSelectorItem(name, name, color, true, change, name === selectedThemeName)
        ),
      ];
      selectedTheme = getSelectedTheme(list, selectedThemeName);
    }

    return {
      items: availableThemeSelectorItems,
      selectedTheme,
      themes: list,
    };
  }
);

interface ThemeToolProps {
  api: API;
}

interface ThemeToolState {
  selected: string;
  expanded: boolean;
}

export class ThemeSelector extends Component<ThemeToolProps, ThemeToolState> {
  state: ThemeToolState = {
    selected: null,
    expanded: false,
  };
  
  private setStories = () => this.setState({ selected: null });

  private setTheme = (theme: string) => this.setState({ selected: theme });

  componentDidMount() {
    const { api } = this.props;
    api.on(SET_STORIES, this.setStories);
    api.on(THEME, this.setTheme);
  }

  componentWillUnmount() {
    const { api } = this.props;
    api.off(SET_STORIES, this.setStories);
    api.off(THEME, this.setTheme);
  }

  change = (args: { selected: string; expanded: boolean }) => {
    const { selected } = args;
    const { api } = this.props;
    const { list, onChange } = getConfigFromApi(api);
    this.setState(args);
    api.emit(CHANGE, selected);
    if (typeof onChange === 'function') {
      const selectedTheme = getSelectedTheme(list, selected);
      onChange(selectedTheme);
    }
  };

  render() {
    const { expanded } = this.state;
    const { items, selectedTheme, themes } = getDisplayableState(
      this.props,
      this.state,
      this.change
    );

    return items.length ? (
      <Fragment>
        <ThemeStory iframeId={iframeId} selectedTheme={selectedTheme} themes={themes} />
        <WithTooltip
          placement="top"
          trigger="click"
          tooltipShown={expanded}
          onVisibilityChange={(newVisibility: boolean) =>
            this.setState({ expanded: newVisibility })
          }
          tooltip={<TooltipLinkList links={items} />}
          closeOnClick
        >
          <IconButton
            key="theme"
            active={selectedTheme}
            title="Change the theme"
          >
            <Palette />
          </IconButton>
        </WithTooltip>
      </Fragment>
    ) : null;
  }
}