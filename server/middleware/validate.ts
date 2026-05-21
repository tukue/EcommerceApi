import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: z.ZodSchema, source: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({ error: result.error.errors });
      return;
    }
    req[source] = result.data;
    next();
  };
}
