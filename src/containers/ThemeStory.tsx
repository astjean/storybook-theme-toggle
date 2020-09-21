import React, { useEffect } from 'react';
// @ts-ignore
import { document } from 'global';
import { Theme } from '../models';

interface Props {
  iframeId: string;
  selectedTheme: Theme;
  themes: Theme[];
}

export const ThemeStory: React.FC<Props> = (props) => {
  const { iframeId, selectedTheme, themes } = props;

  useEffect(() => {
    const manager = document.querySelector('body') as HTMLBodyElement;
    const previewIframe = document.getElementById(iframeId);
    
    if (!previewIframe) {
      return null;
    }

    const previewDocument = previewIframe.contentDocument || previewIframe.contentWindow.document;
    const preview = previewDocument.body as HTMLBodyElement;

    if (selectedTheme && selectedTheme.class) {
      if (typeof selectedTheme.class === 'string') {
        manager.classList.add(selectedTheme.class);
        preview.classList.add(selectedTheme.class);
      } else {
        manager.classList.add(...selectedTheme.class);
        preview.classList.add(...selectedTheme.class);
      }
    }

    return () => themes
      .filter(theme => theme.class)
      .forEach(theme => {
        if (typeof theme.class === 'string') {
          manager.classList.remove(theme.class);
          preview.classList.remove(theme.class);
        } else {
          manager.classList.remove(...theme.class);
          preview.classList.remove(...theme.class);
        }
      });
  });

  return null;
}
