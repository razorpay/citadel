# Citadel

An extensible static site generator.

## Plugins

Citadel can accept plugins in it's config. The plugins need to have the following api:

- **init**: Funtion that would be called at the start of the build process.
  - This function can be used by the plugin to instantiate itself. Example: setup local state.
- **process**: Each document will be passed to this function. Any side effects will then be used by citadel in the build process.
  - Note: Currently, the process function will only apply post markdown parsing.
- **end**: Function is called at the end of the build process

**Order of execution**: Each plugin will be run in the order it is defined in.
