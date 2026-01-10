/**
 * TypeScript declaration for HTML file imports
 * Enables importing .html files as raw strings via webpack
 */
declare module '*.html' {
  const content: string
  export default content
}
