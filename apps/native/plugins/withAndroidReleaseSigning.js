const { withAppBuildGradle } = require("expo/config-plugins");

// Re-injects the release signingConfig into android/app/build.gradle on every
// `expo prebuild`, since that file gets regenerated from scratch otherwise
// (dropping any manual signing setup and silently falling back to the debug
// key). Keystore lives outside android/ in ../../android-signing so it
// survives prebuild --clean too.
const MARKER = "// withAndroidReleaseSigning";

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }

    let contents = config.modResults.contents;

    contents = contents.replace(
      "android {",
      `${MARKER}
def keystorePropertiesFile = file("../../android-signing/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {`,
    );

    contents = contents.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        if (keystorePropertiesFile.exists()) {
            release {
                storeFile file("../../android-signing/" + keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`,
    );

    contents = contents.replace(
      /release\s*\{\s*\/\/ Caution![^\n]*\n[^\n]*\n\s*signingConfig signingConfigs\.debug/,
      `release {\n            signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug`,
    );

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidReleaseSigning;
