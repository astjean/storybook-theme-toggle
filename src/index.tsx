import React from 'react';
import { makeDecorator, StoryContext, StoryGetter, WrapperSettings } from '@storybook/addons';
import { Theme, ThemeConfig } from './models';
import parameters from './parameters';
import { getConfig } from './shared';

import { ThemeDecorator } from './decorators/react';

function wrapper(getStory: StoryGetter, context: StoryContext, { parameters }: WrapperSettings) {
  const config = getConfig(parameters as ThemeConfig | Theme[]);
  
  return (
    <ThemeDecorator config={config}>
      {getStory(context)}
    </ThemeDecorator>
  );
}

export const withThemes = makeDecorator({ ...parameters, wrapper });

if (module && module.hot && module.hot.decline) {
  module.hot.decline();
}
