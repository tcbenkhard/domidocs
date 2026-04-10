import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({});

export async function presignPut(params: {
  bucket: string;
  key: string;
  contentType?: string;
}): Promise<{ url: string; uploadExpiresAt: string }> {
  const cmd = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(client, cmd, { expiresIn: 15 * 60 });
  return {
    url,
    uploadExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}
