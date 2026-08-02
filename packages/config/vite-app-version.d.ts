/** @typedef {import('vite').Plugin} Plugin */

/**
 * @param {{ root?: string }} [options]
 * @returns {Plugin}
 */
export function appVersionPlugin(options?: { root?: string }): import("vite").Plugin;
