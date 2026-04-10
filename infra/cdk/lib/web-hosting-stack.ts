import * as cdk from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  HttpMethods,
} from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type { Construct } from "constructs";

export type WebHostingStackProps = cdk.StackProps & {
  stage: string;
};

/**
 * SPA bucket + CloudFront. Upload `apps/web/dist` via CI (`deploy-web` workflow)
 * using the bucket name and distribution id outputs from this stack.
 */
export class WebHostingStack extends cdk.Stack {
  public readonly bucket: Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebHostingStackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, "WebBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
    this.bucket.grantRead(oai);

    this.distribution = new cloudfront.Distribution(this, "WebDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(0),
        },
      ],
    });

    this.bucket.addCorsRule({
      allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
    });

    new cdk.CfnOutput(this, "WebBucketName", {
      value: this.bucket.bucketName,
    });
    new cdk.CfnOutput(this, "WebDistributionId", {
      value: this.distribution.distributionId,
    });
    new cdk.CfnOutput(this, "WebDistributionUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
    });
  }
}
