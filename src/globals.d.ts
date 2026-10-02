// Globals defined by the plain scripts in js/ (loaded with <script> tags).
export {};

declare global {
  interface Window {
    /** Translation lookup (js/i18n.js). */
    t?: (key: string) => string;
    /** Re-render the cell flow diagram (js/dag-diagram.js). */
    refreshDagDiagram?: () => unknown;
    /** Whether the open notebook holds nothing of the user's (js/io.js). */
    isNotebookPristine(): boolean;
    /** The open notebook as saved in a file (js/io.js). */
    buildNotebookData(): unknown;
    /** Replace the open notebook (js/io.js). */
    loadNotebookData(data: unknown, opts?: { keepReactiveMode?: boolean; confirmed?: boolean }): boolean;
    /** The open notebook, compressed for a link (js/qr-sharing.js). */
    compressNotebook(): Promise<string>;
    /** A link carrying a compressed notebook (js/qr-sharing.js). */
    generateNotebookURL(compressed: string, encrypted: boolean): string;
    /** The Giac engine (Emscripten module, index.html). */
    Module?: { ready?: boolean };
  }
  /** Giac's evaluator, set once the engine is ready (js/giac-init.js). */
  var caseval: ((expr: string) => string) | null;
}
