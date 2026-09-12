const {
  AndroidConfig,
  withAndroidManifest,
  withStringsXml,
} = require("expo/config-plugins");

const STRING_NAME = "asset_statements";

function buildStatements(domains) {
  const json = JSON.stringify(
    domains.map((domain) => ({
      include: `https://${domain}/.well-known/assetlinks.json`,
    })),
  );
  // strings.xml requires literal quotes to be backslash-escaped.
  return json.replace(/"/g, '\\"');
}

function withAssetStatementsStrings(config, domains) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          _: buildStatements(domains),
          $: { name: STRING_NAME, translatable: "false" },
        },
      ],
      config.modResults,
    );
    return config;
  });
}

function withAssetStatementsMetaData(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      STRING_NAME,
      `@string/${STRING_NAME}`,
      "resource",
    );
    return config;
  });
}

function withAndroidAssetStatements(config, props) {
  const domains = props?.domains ?? [];
  if (domains.length === 0) {
    return config;
  }
  return withAssetStatementsMetaData(
    withAssetStatementsStrings(config, domains),
  );
}

module.exports = withAndroidAssetStatements;
