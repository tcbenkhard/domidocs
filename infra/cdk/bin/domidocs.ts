#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { AuthApiStack } from "../lib/auth-api-stack";
import { DataStack } from "../lib/data-stack";
import { StorageStack } from "../lib/storage-stack";
import { WebApiStack } from "../lib/web-api-stack";
import { WebHostingStack } from "../lib/web-hosting-stack";

const app = new cdk.App();
const stage = app.node.tryGetContext("stage") ?? "dev";
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "eu-west-1",
};

const storage = new StorageStack(app, `DomidocsStorage-${stage}`, { stage, env });
const data = new DataStack(app, `DomidocsData-${stage}`, { stage, env });
const auth = new AuthApiStack(app, `DomidocsAuthApi-${stage}`, {
  stage,
  env,
  usersTable: data.usersTable,
  refreshTokensTable: data.refreshTokensTable,
});
auth.addDependency(data);

const web = new WebApiStack(app, `DomidocsWebApi-${stage}`, {
  stage,
  env,
  documentsTable: data.documentsTable,
  documentsBucket: storage.documentsBucket,
  authHttpApi: auth.httpApi,
  jwtIssuer: auth.jwtIssuer,
  jwtAudience: auth.jwtAudience,
});
web.addDependency(storage);
web.addDependency(data);
web.addDependency(auth);

new WebHostingStack(app, `DomidocsWebHosting-${stage}`, {
  stage,
  env,
});

app.synth();
