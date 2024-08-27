<div align="center">

# Healthy Surf
![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)

<!-- ![GitHub action badge](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/actions/workflows/build-zip.yml/badge.svg)
![GitHub action badge](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/actions/workflows/lint.yml/badge.svg) -->

</div>

## Table of Contents

- [Intro](#intro)
- [Platforms Supported](#platforms-supported)
- [Future Supported Platforms](#future-supported-platforms)
- [To-Do](#to-do)
- [Tools Used](#tools-used)
- [Structure](#structure)
    - [ChromeExtension](#chrome-extension)
    - [Packages](#packages)
    - [Pages](#pages)
- [Install](#install)
    - [Procedures](#procedures)
        - [Chrome](#chrome)
        - [Firefox](#firefox)
- [Reference](#reference)

## Intro <a name="intro"></a>

This is a web extension for all major browsers whose purpose is to hide unpleasant or unwanted content on social media platforms and other websites.

## Platforms Supported  <a name="platforms-supported"></a>

- Old Reddit: hides content on /r/all by default, option to enable hiding on any subreddit. Provides filtering by keyword and subreddit.
- Youtube: hides content on any page with video thumbnails, hide Youtube's dismissable segments that breakup pages since Youtube ignores/resets the user's desire to close them on a weekly basis. Filtering based on video titles. Also filters comment sections under videos.
- X (Twitter): Filters sidebar content based on keywords

## Future Supported Platforms <a name="future-supported-platforms"></a>

- Tiktok
- News sites
- New reddit
- Hacker news
- Imgur maybe

## To-Do <a name="to-do"></a>

#### General

- Add UI in extension popup to add keywords, add categories, assign keywords to categories, dev-only button to save to sqlite, on-off toggle
- Update code so that toggling off extension shows all previously hidden content. Ensure toggling on re-hides without page reload.
- Add filtering for usernames on platform-specific basis; Add tagging for username filtering (so that sharing filtering lists on shared preferences can work)
- Add UI for adding usernames, extension to detect which website you're on to auto-associate it the platform. 
- Move entities to shared folder

#### Before First Release
- Add .env and .env.example - needed for github API access for updating gists
- Finish assigning categories to default JSON subreddits
- Make sure IS_DEV_MODE type checking is properly false when built and instsalled 

#### Keeping filtering lists up-to-date
- Update keyword filtering from gists (stored as JSON)
- Update keyword filtering from JSON (if dev mode/JSON is available, otherwise use API call to gist)
- Write tool to dump SQL to JSON file if going with approach to store JSON on a gist for continual updates
- Dev script to update gist JSON via API from local sqlite store


#### Platform Specific
- Add toggle for filtering while viewing specific subreddit or only on /r/all
- Ensure filtering works for "cross-posts", in that the filtering is also applied to the origin subreddit and origin title
- Fix Youtube commenting filtering - it removes entire tree parent comment tree when a single child comment hits a filter
- X/Twitter: add filtering for any crypto stuff
- Remove "members only" youtube videos


## Notes

- I am using sqlite for development purposes because managing default data that ships with the extension is easier here than the WebExtensions Storage API. The extension will load sqlite database data to the WebExtensions Storage API when installed and then operate from there.

## Tools Used <a name="features"></a>

- [React18](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwindcss](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Turborepo](https://turbo.build/repo)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Chrome Extension Manifest Version 3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- Custom HMR(Hot Module Rebuild) Plugin

## Install <a name="install"></a>

### Dev: <a name="procedures"></a>

1. Clone repository
2. Change `extensionDescription` and `extensionName` in `messages.json` file
3. Install pnpm globally: `npm install -g pnpm` (check your node version >= 18.12.0)
4. Run `pnpm install`
5. Run `pnpm run setup-db` to create the local sqlite database if needing to do updates to default data. Include the `--delete` flag if you want it to wipe the current database before running again (if there are structural changes etc).

### And next, depending on the needs:

#### For Chrome: <a name="chrome"></a>

1. Run:
    - Dev: `pnpm dev`
      - When you run with Windows, you should run as
        administrator. [(Issue#456)](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/456)
    - Prod: `pnpm build`
2. Open in browser - `chrome://extensions`
3. Check - `Developer mode`
4. Find and Click - `Load unpacked extension`
5. Select - `dist` folder at root

#### For Firefox: <a name="firefox"></a>

1. Run:
    - Dev: `pnpm dev:firefox`
    - Prod: `pnpm build:firefox`
2. Open in browser - `about:debugging#/runtime/this-firefox`
3. Find and Click - `Load Temporary Add-on...`
4. Select - `manifest.json` from `dist` folder at root

#### <i>Note: Firefox plugins are added in temporary mode and are removed after closing the browser and must be added again when re-opened.</i>

## Structure <a name="structure"></a>

### ChromeExtension <a name="chrome-extension"></a>

Main app with background script, manifest

- `manifest.js` - manifest for chrome extension
- `lib/background` - [background script](https://developer.chrome.com/docs/extensions/mv3/background_pages/) for chrome
  extension (`background.service_worker` in
  manifest.json)
- `public/content.css` - content css for user's page injection

### Packages <a name="packages"></a>

Some shared packages

- `dev-utils` - utils for chrome extension development (manifest-parser, logger)
- `hmr` - custom HMR plugin for vite, injection script for reload/refresh, hmr dev-server
- `shared` - shared code for entire project. (types, constants, custom hooks, components, etc.)
- `storage` - helpers for storage easier integration with, e.g local, session storages
- `tailwind-config` - shared tailwind config for entire project
- `tsconfig` - shared tsconfig for entire project
- `ui` - here's a function to merge your tailwind config with global one, and you can save components here
- `vite-config` - shared vite config for entire project
- `zipper` - By ```pnpm zip``` you can pack ```dist``` folder into ```extension.zip``` inside newly created ```dist-zip``` 

### Pages <a name="pages"></a>

- `content` - [content script](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) for chrome
  extension (`content_scripts` in manifest.json)
- `content-ui` - [content script](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) for render UI in
  user's page (`content_scripts` in manifest.json)
- `content-runtime` - [content runtime script](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#functionality)
   this can be inject from `popup` like standard `content`
- `devtools` - [devtools](https://developer.chrome.com/docs/extensions/mv3/devtools/#creating) for chrome
  extension (`devtools_page` in manifest.json)
- `devtools-panel` - devtools panel for [devtools](pages/devtools/src/index.ts)
- `new-tab` - [new tab](https://developer.chrome.com/docs/extensions/mv3/override/) for chrome
extension (`chrome_url_overrides.newtab` in manifest.json)
- `options` - [options](https://developer.chrome.com/docs/extensions/mv3/options/) for chrome extension (`options_page`
  in manifest.json)
- `popup` - [popup](https://developer.chrome.com/docs/extensions/reference/browserAction/) for chrome
  extension (`action.default_popup` in
  manifest.json)
- `side-panel` - [sidepanel(Chrome 114+)](https://developer.chrome.com/docs/extensions/reference/sidePanel/) for chrome
  extension (`side_panel.default_path` in manifest.json)

## Reference <a name="reference"></a>

- [Vite Plugin](https://vitejs.dev/guide/api-plugin.html)
- [ChromeExtension](https://developer.chrome.com/docs/extensions/mv3/)
- [Rollup](https://rollupjs.org/guide/en/)
- [Turborepo](https://turbo.build/repo/docs)
- [Rollup-plugin-chrome-extension](https://www.extend-chrome.dev/rollup-plugin)


## Disclaimer

This project filters content based on an extensive list of keywords. This list of keywords and their assortment into categories is not a condemenation of any particular keyword or topic related to that keyword, and especially so in that much of the categorization was done automatically with an LLM. It is my hope that no one reads into the inclusion of any keywords or the categorization of a keyword. The process of filtering based on sometimes sensitive words is a delicate situation and it is not my intention to offend or exclude any important topics or groups of people from general discourse and freedoms of speech. This project may also contain keywords and categories from outside sources, and these sources may not be very thoroughly reviewed before inclusion. Viewing the list of filtered keywords contains language not safe for work. 

This extension is built from a [web extension boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite?tab=readme-ov-file) with credit and thanks to them for excellent work!