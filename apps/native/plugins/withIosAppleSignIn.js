const { withEntitlementsPlist } = require("expo/config-plugins");

// ios.usesAppleSignIn only adds this entitlement when expo-apple-authentication is installed.
function withIosAppleSignIn(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.applesignin"] = ["Default"];
    return config;
  });
}

module.exports = withIosAppleSignIn;
