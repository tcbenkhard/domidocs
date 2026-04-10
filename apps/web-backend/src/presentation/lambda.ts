import { handle } from "hono/aws-lambda";
import { loadWebEnv } from "../config";
import { DocumentRepository } from "../data/document-repository";
import { createWebApp } from "./create-app.js";

const env = loadWebEnv();
const documents = new DocumentRepository(env.documentsTableName);
const app = createWebApp({ env, documents });

export const handler = handle(app);
