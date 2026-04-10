import * as cdk from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export type DataStackProps = cdk.StackProps & {
  stage: string;
};

export class DataStack extends cdk.Stack {
  public readonly usersTable: Table;
  public readonly refreshTokensTable: Table;
  public readonly documentsTable: Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.usersTable = new Table(this, "Users", {
      tableName: `domidocs-${props.stage}-users`,
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
 });
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "Gsi1",
      partitionKey: { name: "gsi1pk", type: AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: AttributeType.STRING },
    });

    this.refreshTokensTable = new Table(this, "RefreshTokens", {
      tableName: `domidocs-${props.stage}-refresh-tokens`,
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.documentsTable = new Table(this, "Documents", {
      tableName: `domidocs-${props.stage}-documents`,
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, "UsersTableName", {
      value: this.usersTable.tableName,
    });
  }
}
