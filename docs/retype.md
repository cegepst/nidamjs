# Using Retype

This project uses [Retype](https://retype.com/) to generate the documentation website. Retype is a high-performance
static site generator that builds a website based on simple Markdown text files.

Here is a guide to the most useful features available in Retype, along with references to the official documentation.

## Text Formatting

Retype supports standard Markdown and GitHub Flavored Markdown (GFM).

- **Bold**, _Italic_, `Code`
- Lists, Links, Images
- Tables

[Learn more about Basic Formatting](https://retype.com/guides/markdown/)

## Components & Extensions

Retype extends Markdown with powerful components to create rich documentation.

### Alerts (Admonitions)

Highlight important information using alerts.

```md
!!!
This is a default alert.
!!!

!!!info
This is an info alert.
!!!

!!!warning
This is a warning!
!!!
```

!!!
This is a default alert.
!!!

!!!warning
This is a warning alert.
!!!

[Alerts Documentation](https://retype.com/components/alerts/)

### Code Blocks

Retype provides enhanced code blocks with syntax highlighting, line numbers, and copy buttons.

```js
console.log("Hello World");
```

You can also highlight specific lines:

```js
function hello() {
  console.log("Hello"); // <--- Highlight this
}
```

[Code Blocks Documentation](https://retype.com/components/code-blocks/)

### Tabs

Organize content into tabs.

```md
+++ npm
npm install nidamjs
+++

bun
bun add nidamjs
+++
```

[Tabs Documentation](https://retype.com/components/tabs/)

## Configuration

The project configuration is located in `retype.yml`. This file controls the site settings, branding, sidebar structure,
and more.

### Basic Settings

```yml
input: .
output: .retype
url: https://my-project.com
branding:
  title: My Project
```

### Sidebar Configuration

You can control the sidebar navigation order using the `order` metadata in markdown files or by defining specific links
in `retype.yml`.

```yml
links:
  - text: Home
    link: /
  - text: Guide
    link: guide/
```

[Configuration Reference](https://retype.com/configuration/project/)

## Page Metadata

You can add frontmatter to the top of any `.md` file to customize that specific page.

```yml
---
title: Custom Title
icon: rocket
order: 1
---
```

- **icon**: Sets the page icon in the sidebar ([Icon list](https://retype.com/guides/icons/)).
- **order**: Controls the sort order in the sidebar.
- **label**: Custom label for the sidebar (different from page title).

[Page Configuration](https://retype.com/configuration/page/)

## Icons

Retype includes the **Octicons** and **FontAwesome** icon sets. You can use them in markdown:

```md
:rocket: :zap: :gear:
```

:rocket: :zap: :gear:

[Icons Documentation](https://retype.com/guides/icons/)

## Deployment

Since Retype generates a static site (HTML/CSS/JS), it can be hosted anywhere.

### GitHub Pages

Retype includes a built-in GitHub Action to automatically build and deploy to GitHub Pages.

[GitHub Pages Guide](https://retype.com/hosting/github-pages/)

### Netlify / Vercel

Simply point the build command to `retype build` and the publish directory to `.retype`.

[Hosting Guides](https://retype.com/hosting/netlify/)
