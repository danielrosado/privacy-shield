# Privacyst

Privacyst is a simple Google Chrome Extension which detects and block third-party trackers.

When Privacyst intercepts a request to a third party-domain, it analyzes it and tags it as follows.
- Blocked: The request domain was recognized as a tracker and it was blocked.
- Cookies: The request domain was found in yellow list. This list allows requests to third-party domains only for functionality purposes. Cookie, Referer and Set-Cookie headers are deleted before sending the request or receiving the response.
- Allowed: The request domain was analyzed and it was allowed.

## Architecture

![architecture](https://user-images.githubusercontent.com/18498519/60600967-835a0d80-9db1-11e9-8b85-8ea59e7106b0.jpg)

### Views
- popup.html: shows the third-party domains information and state.
- options.html: lists the domains where the extension is disabled.
- information.html: shows information about the extension.

### Scripts
- popup.js: updates the popup.
- options.js: updates the options page.
- background.js: intercepts the requests and blocks them, removes cookies or allows them.
- TabsManager.js: a ES6 class which storages data about the tab (ID, domain, third-party domains...)
- Domain.js: a ES6 class which simplifies the management of the domains.

### External Modules
- Parse-domain: parses an URL and return its domain, subdomain and top-level domain.
- Bootstrap: a front-end framework for UI designing.
- Font-awesome: an icon set.

## Settings

1. Install Node and NPM
2. Execute the following command to install the dependencies:

```npm install```

3. Execute Webpack for production

```webpack --mode=production```

or development

```webpack --mode=development --watch```
