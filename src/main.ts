/**
 * Entry of the TypeScript part of CAScad, loaded as a module next to the plain
 * scripts of js/: About window, documentation, sharing through QRShare. What inline handlers
 * need is exposed on `window`.
 */
import { showAbout } from './about';
import { restoreSavedNotebook, watchNotebook } from './autosave';
import { openHandedOffNotebook, receiveFromDevice, sendToDevice } from './share/ui';

/** The documentation (loaded on demand: Markdown pages and renderer). */
const showDocs = (slug?: string, section?: string): void => void import('./docs-view').then((m) => m.showDocs(slug, section));
const docsFromHash = (): void => {
  if (location.hash.startsWith('#/docs')) void import('./docs-view').then((m) => m.showDocsFromHash());
};

Object.assign(window, {
  showAboutDialog: showAbout,
  showDocs,
  // Called by js/boot.js at start-up, before the welcome notebook.
  restoreSavedNotebook,
  sendToDevice: () => void sendToDevice(),
  receiveFromDevice,
});

// After js/boot.js has set up the notebook (it runs on DOMContentLoaded).
const afterBoot = (): void => {
  watchNotebook();
  void openHandedOffNotebook();
  // Documentation links (#/docs?page=…), from the README or anywhere else.
  docsFromHash();
  addEventListener('hashchange', docsFromHash);
};
if (document.readyState === 'complete') afterBoot();
else addEventListener('load', afterBoot, { once: true });
