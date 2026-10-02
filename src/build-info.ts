/** Version, commit and date of this build, set by scripts/build.ts. */
declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;
declare const __BUILD_DATE__: string;

export const BUILD = {
  version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev',
  commit: typeof __GIT_COMMIT__ === 'string' && __GIT_COMMIT__ ? __GIT_COMMIT__ : 'unknown',
  date: typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : '',
};

/** Whether the commit is a real one (links to it make sense). */
export const knownCommit = (): boolean => /^[0-9a-f]{7,40}$/.test(BUILD.commit);

export const shortCommit = (): string => (knownCommit() ? BUILD.commit.slice(0, 7) : BUILD.commit);
