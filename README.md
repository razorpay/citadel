# Citadel

Citadel is an extensible static site generator. It takes markdown files and generates html files out if it with the help of pug based templates. The system uses stylus as the css-preprocessor of choice.

## Features

- Pug based templating engine
- Stylus css preprocess
- Branding, multi-site generation
- Extensibility with plugins
- Reusability (with the help of partials)
- Easy redirects
- Document blacklist support
## Setup

To install Citadel in your project

```
  npm install https://github.com/razorpay/citadel
```

Citadel requires a *config* file to be present in the root directory of your project.
The name of the config file can be given through command line as follows
```
citadel -c <config-file-name>
``` 

Default: `config.js`

## Configuration

Citadel accepts a config file with an array of config objects. Each config object defines how to build your static site for that particular organisation/brand. 
Citadel gives the following configuration options

| Name | Description | Required |
|-|-|-|
| org | The organisation / brand scope to build the site for. | true |
| basePath | The basePath where the site will be hosted | true |
| publicPath | The publichPath where the site will be accessible | true |
| port | The port on which the site will be available | true |
| src | The path where the source documents are available | true |
| dist | The path where the built documents need to be stored | true |
| layout | The path where the pug templates are available | true |
| css | The path where the stylus files available | true |
| js | The path where the custom js files available | true |
| assets | The path where the source documents are available | true |
| partials | Path to the partials folder where reusable content can be stored | false |
| redirects | The path to the yaml file to setup redirects. Can be a list of files | false |
| rules | Defines the files to exclude from any build | true |
| plugins | Defines a list of plugins | false |

Sample configuration for an example documentation site:
```
module.exports = [{
    org: "abc",
    basePath: "https://abc.com",
    publicPath: "/docs/",
    port: 8080,
    src: "src/posts",
    dist: "dist",
    layout: "src/layouts/index.pug",
    css: "src/styles/app.styl",
    js: "src/app.js",
    assets: "src/assets",
    partials: "src/partials",
    redirects: ["src/redirects.yml"],
    rules: [
      -setup/initial-setup // ignore file src/posts/setup/intial-setup (`-` indicates ignore)
    ],
    plugins: ["plugins/search"],
  }],
```

## Usage


### Layout
The pug template present in the `layout` variable in the `config` will get the following variables

```
{
  frontmatter: Object, // The frontmatter defined in each post
  href: string, // The url based on the folder structure
  content: string, // The html generated from the body of each post
  config: Object, // The config object defined above
  nav: Array<Link>, // An array of Link objects
}
```

The `Link` object structure is as below

```
{
  level: number, // the depth level of the nav
  active: boolean, // true if this item is currently selected
  href: string, // url associated with the Link
  title: string, // title specified for the Link
  children: Array<Link> // List of child Links
}
```

This nav list is generated from the tree defined in the frontmatter of each index document under the `src` folder specified in the config.

## Internals
### Document structure

Following is the structure of the document parsed and generated from Citadel.

```js
Document:
{
  key: string,
  frontMatter: object,
  body: string,
  href: string,
  tree: Array<Tree>,
}

Tree: 
{
  key: string | false,
  title: string,
  level: number,
}
```

## Plugins

Citadel can accept a list of plugins in the config. The plugins need to have the following api:

- **name**: Name of the plugin.
  - Note: This will be used in log statements. Any name conflicts won't affect the functionality.
- **init**: Function that would be called at the start of the build process.
  - This function can be used by the plugin to instantiate itself. Example: setup local state.
  - init: function(config: object): void
- **process**: Each document will be passed to this function. Any side effects applied to the documents will then be used by citadel in the build process.
  - Note: Currently, the process function will only apply post markdown parsing.
  - process: function(doc: Document): Document
- **end**: Function is called at the end of the build process
  - end: function(): void

**Order of execution**: Each plugin will be run in the order it is defined in the config.
