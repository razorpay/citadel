# Citadel

An extensible static site generator.

## Internal details

### Document structure

Following is the structure of the document parsed and generated from Citadel

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

- **init**: Function that would be called at the start of the build process.
  - This function can be used by the plugin to instantiate itself. Example: setup local state.
  - init: function(config: object): void
- **process**: Each document will be passed to this function. Any side effects applied to the documents will then be used by citadel in the build process.
  - Note: Currently, the process function will only apply post markdown parsing.
  - process: function(doc: Document): Document
- **end**: Function is called at the end of the build process
  - end: function(): void

**Order of execution**: Each plugin will be run in the order it is defined in the config.
