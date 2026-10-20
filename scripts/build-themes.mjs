import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const themes = {
  light: {
    codeThemeId: 'codex', variant: 'light',
    theme: {
      accent: '#b33d7e', accentSource: 'custom', contrast: 45,
      surface: '#fff7fc', ink: '#45334b', opaqueWindows: true,
      fonts: { code: null, ui: null },
      semanticColors: { diffAdded: '#16804a', diffRemoved: '#c0364d', skill: '#8050c2' },
    },
  },
  dark: {
    codeThemeId: 'codex', variant: 'dark',
    theme: {
      accent: '#f3a6cd', accentSource: 'custom', contrast: 60,
      surface: '#241e2b', ink: '#f6eaf4', opaqueWindows: true,
      fonts: { code: null, ui: null },
      semanticColors: { diffAdded: '#80d4a5', diffRemoved: '#ff93a6', skill: '#c6a4f6' },
    },
  },
};
await mkdir(path.join(root, 'themes'), { recursive: true });
for (const [variant, theme] of Object.entries(themes)) {
  await writeFile(path.join(root, 'themes', `candy-jelly-${variant}.json`), JSON.stringify(theme, null, 2) + '\n');
  await writeFile(path.join(root, 'themes', `candy-jelly-${variant}.txt`), 'codex-theme-v1:' + JSON.stringify(theme) + '\n');
}
