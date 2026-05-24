const path = require("path")

// Compute the path from the expo-router package directory to our app/ directory.
// Expo CLI normally sets EXPO_ROUTER_APP_ROOT to this value, but in an npm-workspaces
// monorepo the package is hoisted to the root node_modules so the auto-detection fails.
const expoRouterDir = path.dirname(
  require.resolve("expo-router/package.json", { paths: [__dirname] })
)
const appRoot = path
  .relative(expoRouterDir, path.join(__dirname, "app"))
  .split(path.sep)
  .join("/") // normalise to forward slashes on Windows

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Inline Expo Router env vars so Metro's require.context() gets string literals.
      // Expo CLI normally sets these, but in an npm-workspaces monorepo the auto-detection
      // fails because expo-router is hoisted to the root node_modules.
      function inlineExpoRouterEnv({ types: t }) {
        const replacements = {
          EXPO_ROUTER_APP_ROOT: appRoot,
          EXPO_ROUTER_IMPORT_MODE: "sync",
        }
        return {
          visitor: {
            MemberExpression(p) {
              if (
                t.isMemberExpression(p.node.object) &&
                t.isIdentifier(p.node.object.object, { name: "process" }) &&
                t.isIdentifier(p.node.object.property, { name: "env" }) &&
                t.isIdentifier(p.node.property) &&
                replacements[p.node.property.name] !== undefined
              ) {
                p.replaceWith(t.stringLiteral(replacements[p.node.property.name]))
              }
            },
          },
        }
      },
    ],
  }
}
