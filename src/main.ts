/**
 * Entry of the TypeScript part of CAScad, loaded as a module next to the plain
 * scripts of js/: About window, sharing through QRShare. What inline handlers
 * need is exposed on `window`.
 */
import { showAbout } from './about';
import { openHandedOffNotebook, receiveFromDevice, sendToDevice } from './share/ui';

Object.assign(window, {
  showAboutDialog: showAbout,
  sendToDevice: () => void sendToDevice(),
  receiveFromDevice,
});

// After js/boot.js has set up the notebook (it runs on DOMContentLoaded).
if (document.readyState === 'complete') void openHandedOffNotebook();
else addEventListener('load', () => void openHandedOffNotebook(), { once: true });
