import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Provider } from "aws-cdk-lib/custom-resources";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";
import {
  authLambdaEntry,
  jwtKeyHandlerEntry,
  pnpmLockfile,
  REPO_ROOT,
} from "./paths";

export type AuthApiStackProps = cdk.StackProps & {
  stage: string;
  usersTable: ITable;
  refreshTokensTable: ITable;
};

export class AuthApiStack extends cdk.Stack {
  public readonly httpApi: apigwv2.HttpApi;
  public readonly jwtIssuer: string;
  public readonly jwtAudience = "domidocs-api";

  constructor(scope: Construct, id: string, props: AuthApiStackProps) {
    super(scope, id, props);

    const { stage } = props;
    this.jwtIssuer = `https://domidocs/${stage}/auth`;

    const jwtSecret = new secretsmanager.Secret(this, "JwtPrivateKey", {
      secretName: `domidocs/${stage}/jwt-private`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const publicKeyParamName = `/domidocs/${stage}/auth/jwt-public-pem`;

    const onEvent = new NodejsFunction(this, "JwtKeyOnEvent", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: jwtKeyHandlerEntry,
      handler: "handler",
      timeout: cdk.Duration.seconds(60),
      bundling: {
        format: OutputFormat.CJS,
        target: "node20",
        externalModules: [],
      },
      projectRoot: REPO_ROOT,
      depsLockFilePath: pnpmLockfile,
    });

    onEvent.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:PutSecretValue"],
        resources: [jwtSecret.secretArn],
      }),
    );
    onEvent.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:PutParameter", "ssm:DeleteParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${publicKeyParamName}`,
        ],
      }),
    );

    const provider = new Provider(this, "JwtKeyProvider", {
      onEventHandler: onEvent,
    });

    const keyResource = new cdk.CustomResource(this, "JwtRsaKey", {
      serviceToken: provider.serviceToken,
      resourceType: "Custom::DomidocsJwtRsaKey",
      properties: {
        SecretArn: jwtSecret.secretArn,
        PublicKeyParameterName: publicKeyParamName,
      },
    });

    const authFn = new NodejsFunction(this, "AuthFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: authLambdaEntry,
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      environment: {
        STAGE: stage,
        USERS_TABLE_NAME: props.usersTable.tableName,
        REFRESH_TOKENS_TABLE_NAME: props.refreshTokensTable.tableName,
        JWT_ISSUER: this.jwtIssuer,
        JWT_AUDIENCE: this.jwtAudience,
        JWT_PRIVATE_KEY_SECRET_ARN: jwtSecret.secretArn,
        JWT_PUBLIC_KEY_PARAM_NAME: publicKeyParamName,
      },
      bundling: {
        format: OutputFormat.CJS,
        target: "node20",
        sourceMap: true,
      },
      projectRoot: REPO_ROOT,
      depsLockFilePath: pnpmLockfile,
    });

    authFn.node.addDependency(keyResource);

    jwtSecret.grantRead(authFn);
    authFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${publicKeyParamName}`,
        ],
      }),
    );
    props.usersTable.grantReadWriteData(authFn);
    props.refreshTokensTable.grantReadWriteData(authFn);

    this.httpApi = new apigwv2.HttpApi(this, "AuthHttpApi", {
      apiName: `domidocs-auth-${stage}`,
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
        "AuthIntegration",
        authFn,
      ),
    });

    new cdk.CfnOutput(this, "AuthApiUrl", {
      value: this.httpApi.apiEndpoint,
    });
  }
}
