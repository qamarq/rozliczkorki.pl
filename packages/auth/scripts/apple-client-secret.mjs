import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const [keyPath, teamId, keyId, clientId] = process.argv.slice(2);

if (!keyPath || !teamId || !keyId || !clientId) {
  console.error(
    "Usage: pnpm --filter @repo/auth apple:secret <AuthKey.p8> <team-id> <key-id> <services-id>",
  );
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const unsigned = `${encode({ alg: "ES256", kid: keyId })}.${encode({
  iss: teamId,
  iat: now,
  exp: now + 180 * 24 * 60 * 60,
  aud: "https://appleid.apple.com",
  sub: clientId,
})}`;
const signature = sign("sha256", Buffer.from(unsigned), {
  key: createPrivateKey(readFileSync(keyPath, "utf8")),
  dsaEncoding: "ieee-p1363",
});

console.log(`${unsigned}.${signature.toString("base64url")}`);
