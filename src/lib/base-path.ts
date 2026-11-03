/** URL for a file in /public, correct when the app is served from a sub-path (GitHub Pages). */
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
