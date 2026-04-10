import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import type { IBucket } from "aws-cdk-lib/aws-s3";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";
import {
  pnpmLockfile,
  REPO_ROOT,
  webLambdaEntry,
} from "./paths";

export type WebApiStackProps = cdk.StackProps & {
  stage: string;
  documentsTable: ITable;
  documentsBucket: IBucket;
  authHttpApi: apigwv2.IHttpApi;
  jwtIssuer: string;
  jwtAudience: string;
};

export class WebApiStack extends cdk.Stack {
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: WebApiStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const authJwksUrl = `${props.authHttpApi.apiEndpoint}/.well-known/jwks.json`;

    const webFn = new NodejsFunction(this, "WebFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: webLambdaEntry,
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      environment: {
        STAGE: stage,
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
        JWT_ISSUER: props.jwtIssuer,
        JWT_AUDIENCE: props.jwtAudience,
        AUTH_JWKS_URL: authJwksUrl,
      },
      bundling: {
        format: OutputFormat.CJS,
        target: "node20",
        sourceMap: true,
      },
      projectRoot: REPO_ROOT,
      depsLockFilePath: pnpmLockfile,
    });

    props.documentsTable.grantReadWriteData(webFn);
    props.documentsBucket.grantReadWrite(webFn);

    this.httpApi = new apigwv2.HttpApi(this, "WebHttpApi", {
      apiName: `domidocs-web-${stage}`,
      corsPreflight: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
      },
    });

    this.httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new apigwv2Integrations.HttpLambdaIntegration(
        "WebIntegration",
        webFn,
      ),
    });

    new cdk.CfnOutput(this, "WebApiUrl", {
      value: this.httpApi.apiEndpoint,
    });
  }
}
