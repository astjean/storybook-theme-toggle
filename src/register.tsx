import addons, { types } from '@storybook/addons';
import * as React from 'react';
import Tool, { prefersDark, store } from './Tool';

const currentStore = store();

addons.setConfig({
  theme:
    currentStore[
      currentStore.current || (prefersDark.matches && 'dark') || 'light'
    ]
});

addons.register('storybook/theme-toggle', api => {
  addons.add('storybook/theme-toggle', {
    title: 'Theme Toggle',
    type: types.TOOL,
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: () => (
      <Tool api={api} />
    ),
  });
});
