const { withAndroidStyles } = require("expo/config-plugins");

// android:statusBarColor and android:navigationBarColor are deprecated as of
// Android 15 and flagged by Play Console under "deprecated APIs or parameters
// for edge-to-edge". The prebuild template still writes them into styles.xml,
// so strip them on every `expo prebuild`.
const DEPRECATED_ITEMS = ["android:statusBarColor", "android:navigationBarColor"];

function withAndroidEdgeToEdge(config) {
  return withAndroidStyles(config, (config) => {
    for (const style of config.modResults.resources.style ?? []) {
      if (!style.item) continue;
      style.item = style.item.filter((item) => !DEPRECATED_ITEMS.includes(item.$.name));
    }
    return config;
  });
}

module.exports = withAndroidEdgeToEdge;
