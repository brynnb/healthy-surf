import { toggleTheme } from '@lib/toggleTheme';
import Platform from './Platform';

void toggleTheme();

const blockedSubreddits = ['meme', 'wtf', 'antimlm'];
const blockedKeywords = ['trump', 'covid', '911 call', 'hillary clinton'];

function hasFilteredKeywordsInText(text: string) {
  const str = text.toUpperCase();
  return blockedKeywords.some(v => str.indexOf(v.toUpperCase()) >= 0);
}

const IS_DEV_MODE = !('update_url' in chrome.runtime.getManifest());

if (IS_DEV_MODE) {
  debugLog('Dev mode is enabled');
  debugLog('Content script loaded');
}

function debugLog(str: string) {
  if (IS_DEV_MODE) console.log(str);
}

const redditFilter = () => {
  document.querySelectorAll<HTMLAnchorElement>('a.title').forEach(anchor => {
    const str = anchor.innerHTML.toUpperCase();
    if (hasFilteredKeywordsInText(str)) {
      const parentElement: HTMLElement | null = anchor.closest('.thing.link');
      if (parentElement) {
        parentElement.style.display = 'none';
      }
    }
  });

  // Add this code in development mode to make titles less distracting
  if (IS_DEV_MODE) {
    document.querySelectorAll<HTMLAnchorElement>('a.title').forEach(anchor => {
      anchor.innerHTML = 'blah blah blah blah blah';
    });
  }
};

const twitterFilter = () => {
  // Implement Twitter-specific filtering logic here
};

const youtubeFilter = () => {
  // Implement YouTube-specific filtering logic here
};

const platforms: Platform[] = [
  new Platform('www.reddit.com', redditFilter),
  new Platform('new.reddit.com', redditFilter),
  new Platform('old.reddit.com', redditFilter),
  new Platform('twitter.com', twitterFilter),
  new Platform('www.youtube.com', youtubeFilter),
];

class HealthySurf {
  extensionEnabled: boolean;
  currentCheckRunning: (() => void) | null;
  currentPageHeight: number;

  constructor() {
    this.extensionEnabled = true;
    this.currentCheckRunning = null;
    this.currentPageHeight = 0;
  }

  init() {
    debugLog('Loading Healthy Surf');

    if (!this.extensionEnabled) {
      window.stop();
    }

    this.startHeightPolling();
    this.checkCurrentPlatform();
  }

  startHeightPolling() {
    setInterval(() => {
      const body = document.body;
      const html = document.documentElement;

      const newPageHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      );

      if (newPageHeight !== this.currentPageHeight && this.currentCheckRunning) {
        this.currentCheckRunning();
        this.currentPageHeight = newPageHeight;
      }
    }, 500);
  }

  checkCurrentPlatform() {
    const hostname = window.location.hostname;
    const platform = platforms.find(platform => platform.name === hostname);
    if (platform) {
      this.currentCheckRunning = platform.runFiltering.bind(platform);
      this.currentCheckRunning();
    }
  }
}

export { HealthySurf };
