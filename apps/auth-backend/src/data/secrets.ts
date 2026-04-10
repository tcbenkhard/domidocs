import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({});

let cachedPrivateKeyPem: string | null = null;

export async function getJwtPrivateKeyPem(secretArn: string): Promise<string> {
  if (cachedPrivateKeyPem) return cachedPrivateKeyPem;
  const out = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );
  const v = out.SecretString;
  if (!v) throw new Error("JWT private key secret is empty");
  cachedPrivateKeyPem = v;
  return v;
}
