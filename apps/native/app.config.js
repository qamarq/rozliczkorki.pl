const config = require("./app.json");

const googleSignIn = config.expo.plugins.find(
  (plugin) =>
    Array.isArray(plugin) && plugin[0] === "@react-native-google-signin/google-signin",
);

if (googleSignIn && process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) {
  googleSignIn[1].iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
}

if (process.env.IOS_BUILD_NUMBER) {
  config.expo.ios.buildNumber = process.env.IOS_BUILD_NUMBER;
}

module.exports = config;
