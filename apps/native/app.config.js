const config = require("./app.json");

const googleSignIn = config.expo.plugins.find(
  (plugin) =>
    Array.isArray(plugin) && plugin[0] === "@react-native-google-signin/google-signin",
);

if (googleSignIn && process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) {
  googleSignIn[1].iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
}

module.exports = config;
