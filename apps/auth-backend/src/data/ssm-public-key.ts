import {
  GetParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";

const client = new SSMClient({});

let cached: string | null = null;

export async function getPublicKeyPemFromSsm(paramName: string): Promise<string> {
  if (cached) return cached;
  const out = await client.send(
    new GetParameterCommand({ Name: paramName, WithDecryption: false }),
  );
  const v = out.Parameter?.Value;
  if (!v) throw new Error("JWT public key parameter is empty");
  cached = v;
  return v;
}
