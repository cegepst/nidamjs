# NidamJS

![NPM Version](https://img.shields.io/npm/v/@moonitoring/nidamjs)
![License](https://img.shields.io/github/license/cegepst/nidamjs)
![NPM Downloads](https://img.shields.io/npm/dm/@moonitoring/nidamjs)

NidamJS is a framework-agnostic JavaScript library for desktop-like window components in web applications.

## About The Project

NidamJS aims to provide a simple yet powerful way to integrate desktop-like windowing capabilities into your web applications, offering a fluid and intuitive user experience. It's designed to be lightweight and compatible with various JavaScript frameworks.

### Tech Stack

*   [Javascript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
*   [Vite](https://vitejs.dev/) (Build Tool)
*   [Vitest](https://vitest.dev/) (Testing Framework)
*   [Express](https://expressjs.com/) (Potentially for SSR examples or development server)
*   [JSDOM](https://github.com/jsdom/jsdom) (DOM implementation for Node.js, likely for testing)
*   [Prettier](https://prettier.io/) (Code Formatter)

## Getting Started

To integrate NidamJS into your project, follow the installation steps below.

### Prerequisites

Ensure you have Node.js (which includes npm) installed on your system.

npm
```sh
npm install npm@latest -g
```

### Installation

Install NidamJS via npm:
```sh
npm install @moonitoring/nidamjs
```

## Quick Start Example

Here's a basic example to get you started with NidamJS, demonstrating how to create and manage a simple window component:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>NidamJS App</title>

    <!-- Include the NidamJS CSS -->
    <link href="/node_modules/nidamjs/dist/nidam.css" rel="stylesheet" />

    <!-- Include the NidamJS ES Module -->
    <script type="module" src="/node_modules/nidamjs/dist/nidam.es.js"></script>
  </head>
  <body>
    <div nd-desktop>

      <!-- Desktop Icons Grid -->
      <section nd-icons="8:4">
        <div nd-icon="1:1" nd-id="hello" data-modal="hello">
          <img src="/icons/hello.png" alt="Hello" />
          <span>Hello</span>
        </div>
      </section>

      <!-- Taskbar -->
      <div nd-taskbar>
        <div nd-taskbar-icon data-modal="hello">
          <img src="/icons/hello.png" alt="Hello" />
        </div>
      </div>

      <!-- Toasts notification -->
      <div nd-toast-stack data-position="bottom-right"></div>
    </div>
  </body>
</html>
```

And here's an example window file:

```html
<div nd-window nd-window-endpoint="hello">
  <div nd-window-header>
    <span>Hello</span>
    <button nd-window-button="maximize" title="Maximize">[ ]</button>
    <button nd-window-button="close" title="Close">X</button>
  </div>

  <div nd-window-content>
    <span>Hello World!</span>
  </div>
</div>
```

For more detailed examples and API reference, please refer to the [project's documentation](https://cegepst.github.io/nidamjs-docs).

## Contributing

Contributions are highly welcome! Whether it's reporting bugs, suggesting features, or submitting pull requests, your help makes NidamJS better for everyone.

To contribute:

1.  **Fork the Project:** Go to [https://github.com/cegepst/nidamjs](https://github.com/cegepst/nidamjs) and click the "Fork" button.
2.  **Clone your Fork:**
```sh
git clone https://github.com/YOUR_USERNAME/nidamjs.git
cd nidamjs
```
3.  **Install Dependencies:**
```sh
npm install
```
or if using Bun:
```sh
bun install
```
4.  **Create your Feature Branch:**
```sh
git checkout -b feature/AmazingFeature
```
5.  **Make Changes and Test:** Implement your features or bug fixes. Ensure existing tests pass and add new ones if necessary.
6.  **Run Tests:**
```sh
npm test
```
or
```sh
bun test
```
7.  **Format Code:**
```sh
npm run format
```
or
```sh
bun run format
```
8.  **Commit your Changes:**
```sh
git commit -m 'feat: Add some AmazingFeature'
```
9.  **Push to the Branch:**
```sh
git push origin feature/AmazingFeature
```
10. **Open a Pull Request:** Go to your forked repository on GitHub and open a pull request to the `cegepst/nidamjs` `dev` branch.

Please ensure your pull requests are well-described and pass all CI checks.

## License

Distributed under the MIT License. See the `LICENSE` file in the repository for more information.

## Contact

Project Link: [https://github.com/cegepst/nidamjs](https://github.com/cegepst/nidamjs)

For questions or suggestions, please open an issue on the GitHub repository.
