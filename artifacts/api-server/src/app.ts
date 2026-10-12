import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use((req, res, next) => {
  if (
    req.path !== "/api/nutai/chat" ||
    (req.method !== "OPTIONS" && req.method !== "POST")
  ) {
    next();
    return;
  }

  const requestInfo = {
    method: req.method,
    origin: req.get("origin") ?? null,
    requestedMethod: req.get("access-control-request-method") ?? null,
    requestedHeaders: req.get("access-control-request-headers") ?? null,
    hasAuthorization: Boolean(req.get("authorization")),
    contentLength: req.get("content-length") ?? null,
  };
  logger.info(requestInfo, "NutAI transport request received");

  res.once("finish", () => {
    logger.info(
      {
        ...requestInfo,
        statusCode: res.statusCode,
        allowOrigin: res.getHeader("access-control-allow-origin") ?? null,
        allowCredentials:
          res.getHeader("access-control-allow-credentials") ?? null,
        allowMethods: res.getHeader("access-control-allow-methods") ?? null,
        allowHeaders: res.getHeader("access-control-allow-headers") ?? null,
      },
      "NutAI transport response completed",
    );
  });
  res.once("close", () => {
    if (!res.writableFinished) {
      logger.warn(
        { ...requestInfo, statusCode: res.statusCode },
        "NutAI transport connection closed before response finished",
      );
    }
  });

  next();
});
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
