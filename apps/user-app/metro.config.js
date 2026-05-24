const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot  = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

// Watch the entire monorepo so Metro picks up changes in packages/
config.watchFolders = [workspaceRoot]

// Resolve modules from both the app's node_modules and the root node_modules.
// List the app first so its pinned React 18 is found before the root copy.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

module.exports = config
