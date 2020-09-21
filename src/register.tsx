import addons, { types } from '@storybook/addons';
import * as React from 'react';
import { ADDON_ID } from './constants';
import { ThemeSelector } from './containers/ThemeSelector';

addons.register(ADDON_ID, api => {
  addons.add(ADDON_ID, {
    title: 'Themes',
    type: types.TOOL,
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs' || viewMode === 'notes',
    render: () => <ThemeSelector api={api} />,
  });
});

