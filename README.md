# TabMori

TabMori is a clean Chrome new tab extension for people who keep too many tabs open.

It groups opened tabs by website, helps you search tabs and bookmarks, highlights duplicates, and gives you a small read-later area without turning the new tab page into another dashboard.

## Features

- Group current tabs by domain
- Search opened tabs and Chrome bookmarks
- Jump to an existing tab instead of opening duplicates
- Mark duplicate pages
- Save pages to read later
- Close a tab group quickly
- Rename the page title locally
- Works locally, without an account or server

## Install From ZIP

1. Download `TabMori.zip`.
2. Unzip it into a normal folder.
3. Open `chrome://extensions` in Chrome.
4. Turn on Developer mode.
5. Click Load unpacked.
6. Select the unzipped TabMori folder.
7. Open a new tab.

Do not select the ZIP file directly. Chrome needs the unzipped folder that contains `manifest.json`.

## Local Development

This is a plain Manifest V3 extension. No build step is required.

```bash
git clone https://github.com/YOUR_NAME/TabMori.git
cd TabMori
```

Then load the project folder from `chrome://extensions` with Developer mode enabled.

## Privacy

TabMori does not use a backend, account system, analytics, or external API.

Saved read-later items and the custom page name are stored locally with `chrome.storage.local`.

## License

MIT
