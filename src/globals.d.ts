// Globals defined by the plain scripts in js/ (loaded with <script> tags).
export {};

declare global {
  interface Window {
    /** Translation lookup (js/i18n.js). */
    t?: (key: string) => string;
    /** Re-render the cell flow diagram (js/dag-diagram.js). */
    refreshDagDiagram?: () => unknown;
  }
}
