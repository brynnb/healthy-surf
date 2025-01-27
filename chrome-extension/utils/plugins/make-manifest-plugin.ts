import * as fs from 'fs';
import * as path from 'path';
import type { PluginOption } from 'vite';
import { pathToFileURL } from 'url';
import * as process from 'process';

const { resolve } = path;

const rootDir = resolve(__dirname, '..', '..');
const manifestFile = resolve(rootDir, 'manifest.js');

function colorLog(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') {
  const colors = {
    success: '\x1b[32m',
    info: '\x1b[34m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  };

  const color = colors[type];
  console.log(`${color}%s\x1b[0m`, message);
}

function convertManifestToString(manifest: chrome.runtime.ManifestV3, platform: 'chrome' | 'firefox'): string {
  if (platform === 'firefox') {
    const manifestCopy = { ...manifest };
    if (manifestCopy.background?.service_worker) {
      const serviceWorker = manifestCopy.background.service_worker;
      const { background, ...rest } = manifestCopy;
      return JSON.stringify(
        {
          ...rest,
          background: {
            type: 'module',
            scripts: [serviceWorker],
          } as any, // Firefox has a different manifest type
        },
        null,
        2,
      );
    }
  }
  return JSON.stringify(manifest, null, 2);
}

const getManifestWithCacheBurst = (): Promise<{ default: chrome.runtime.ManifestV3 }> => {
  const withCacheBurst = (path: string) => `${path}?${Date.now().toString()}`;
  /**
   * In Windows, import() doesn't work without file:// protocol.
   * So, we need to convert path to file:// protocol. (url.pathToFileURL)
   */
  if (process.platform === 'win32') {
    return import(withCacheBurst(pathToFileURL(manifestFile).href));
  }
  return import(withCacheBurst(manifestFile));
};

export default function makeManifestPlugin(config: { outDir: string }): PluginOption {
  function makeManifest(manifest: chrome.runtime.ManifestV3, to: string) {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to);
    }
    const manifestPath = resolve(to, 'manifest.json');

    const isFirefox = process.env.__FIREFOX__ === 'true';
    fs.writeFileSync(manifestPath, convertManifestToString(manifest, isFirefox ? 'firefox' : 'chrome'));

    colorLog(`Manifest file copy complete: ${manifestPath}`, 'success');
  }

  return {
    name: 'make-manifest',
    buildStart() {
      this.addWatchFile(manifestFile);
    },
    async writeBundle() {
      const outDir = config.outDir;
      const manifest = await getManifestWithCacheBurst();
      makeManifest(manifest.default, outDir);
    },
  };
}
