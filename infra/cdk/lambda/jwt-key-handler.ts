import {
  PutSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
  DeleteParameterCommand,
  PutParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { generateKeyPairSync } from "node:crypto";

type Event = {
  RequestType: "Create" | "Update" | "Delete";
  PhysicalResourceId?: string;
  ResourceProperties: {
    SecretArn: string;
    PublicKeyParameterName: string;
  };
};

const sm = new SecretsManagerClient({});
const ssm = new SSMClient({});

export async function handler(event: Event) {
  const { RequestType, ResourceProperties } = event;
  const { SecretArn, PublicKeyParameterName } = ResourceProperties;

  if (RequestType === "Delete") {
    try {
      await ssm.send(
        new DeleteParameterCommand({ Name: PublicKeyParameterName }),
      );
    } catch {
      /* ignore */
    }
    return { PhysicalResourceId: event.PhysicalResourceId ?? SecretArn };
  }

  if (RequestType === "Update") {
    return { PhysicalResourceId: event.PhysicalResourceId ?? SecretArn };
  }

  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  await sm.send(
    new PutSecretValueCommand({
      SecretId: SecretArn,
      SecretString: privateKey,
    }),
  );

  await ssm.send(
    new PutParameterCommand({
      Name: PublicKeyParameterName,
      Type: "String",
      Value: publicKey,
      Overwrite: true,
    }),
  );

  return {
    PhysicalResourceId: SecretArn,
    Data: {
      PublicKeyPem: publicKey,
    },
  };
}
