const { withAppBuildGradle, withGradleProperties } = require("expo/config-plugins");

const DEFAULT_PROGUARD = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZED_PROGUARD = 'getDefaultProguardFile("proguard-android-optimize.txt")';
const RESOURCE_SHRINKING_PROPERTY = "android.r8.optimizedResourceShrinking";

// proguard-android.txt ships `-dontoptimize`, so R8 only shrinks/obfuscates and
// Play Console reports the build as unoptimised. The -optimize variant is the
// same config without that line.
function withOptimizedProguardFile(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(DEFAULT_PROGUARD)) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      DEFAULT_PROGUARD,
      OPTIMIZED_PROGUARD,
    );
    return config;
  });
}

function withOptimizedResourceShrinking(config) {
  return withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => !(item.type === "property" && item.key === RESOURCE_SHRINKING_PROPERTY),
    );
    config.modResults.push({
      type: "property",
      key: RESOURCE_SHRINKING_PROPERTY,
      value: "true",
    });
    return config;
  });
}

function withAndroidR8Optimization(config) {
  return withOptimizedResourceShrinking(withOptimizedProguardFile(config));
}

module.exports = withAndroidR8Optimization;
