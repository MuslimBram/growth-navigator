import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runBusinessAnalysis } from "./business-analysis.server";
import { generateAndPersistFromAnalysis } from "./recommendation-engine.server";

const analyzeSchema = z.object({
  visitorId: z.string().min(1).max(128),
  sessionId: z.string().uuid().nullable().optional(),
  userText: z.string().max(4000).optional().default(""),
  imagePaths: z
    .array(z.string().min(1).max(512))
    .max(5)
    .optional()
    .default([]),
});

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export const analyzeBusinessReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analyzeSchema.parse(input))
  .handler(async ({ data }) => {
    // Pull each uploaded image from storage and turn into a base64 data URL.
    const imageDataUrls: string[] = [];
    for (const path of data.imagePaths) {
      const { data: file, error } = await supabaseAdmin.storage
        .from("business-reports")
        .download(path);
      if (error || !file) {
        console.warn("[analyzeBusinessReport] missing file", path, error);
        continue;
      }
      const mime = file.type || "image/png";
      if (!ALLOWED_MIME.has(mime)) {
        console.warn("[analyzeBusinessReport] disallowed mime", mime);
        continue;
      }
      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.byteLength > MAX_BYTES) {
        console.warn(
          "[analyzeBusinessReport] file too large",
          path,
          buf.byteLength,
        );
        continue;
      }
      imageDataUrls.push(`data:${mime};base64,${buf.toString("base64")}`);
    }

    const result = await runBusinessAnalysis({
      visitorId: data.visitorId,
      sessionId: data.sessionId ?? null,
      imageDataUrls,
      imagePaths: data.imagePaths,
      userText: data.userText.trim(),
    });

    // Fire-and-forget: generate admin recommendation in background
    if (result?.id) {
      generateAndPersistFromAnalysis(result.id).catch((e) =>
        console.error("[analyzeBusinessReport] recommendation trigger failed:", e),
      );
    }

    return result;
  });
