import serverlessHttp from "serverless-http";
import app from "./serverless-app.js";

export const handler = serverlessHttp(app);
