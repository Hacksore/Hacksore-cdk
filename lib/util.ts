import { Octokit } from "octokit";
import * as sodium from "@devtomio/sodium";

const { GH_TOKEN } = process.env;

// github client
const octokit = new Octokit({ auth: GH_TOKEN });

const getPublicKey = async () => {
  const pubKey = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/secrets/public-key",
    {
      owner: "Hacksore",
      repo: "Hacksore",
    }
  );

  return pubKey.data;
};

// helper to set secrets
export const setRepoSecret = async (secretName: string, secretValue: string) => {
  const pubKey = await getPublicKey();

  // Convert the message and key to Uint8Array's (Buffer implements that interface)
  const messageBytes = Buffer.from(secretValue);
  const keyBytes = Buffer.from(pubKey.key, 'base64');

  // Encrypt using LibSodium.
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);

  // Base64 the encrypted secret
  const encryptedEncryptionKey = Buffer.from(encryptedBytes).toString('base64');
  console.log("Setting ip to", encryptedEncryptionKey);
  console.log("Plaintext", secretName, secretValue);

  await octokit.request(
    "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
    {
      owner: "Hacksore",
      repo: "Hacksore",
      secret_name: secretName,
      encrypted_value: encryptedEncryptionKey,
      key_id: pubKey.key_id
    }
  );
};
