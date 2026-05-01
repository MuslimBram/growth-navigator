// Public upload endpoint for diagnostic screenshots.
// Accepts multipart/form-data with a `file` field; returns { url }.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "diagnostic-screenshots";
const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const Route = createFileRoute("/api/public/upload-screenshot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            return new Response(JSON.stringify({ error: "Mungon file" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (file.size > MAX_BYTES) {
            return new Response(JSON.stringify({ error: "Imazhi është shumë i madh (max 6MB)" }), {
              status: 413,
              headers: { "Content-Type": "application/json" },
            });
          }
          if (!ALLOWED.includes(file.type)) {
            return new Response(JSON.stringify({ error: "Lloji i imazhit nuk lejohet" }), {
              status: 415,
              headers: { "Content-Type": "application/json" },
            });
          }

          const ext = file.type.split("/")[1] || "png";
          const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
          const buffer = await file.arrayBuffer();

          const { error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, buffer, { contentType: file.type, upsert: false });

          if (error) {
            console.error("[upload-screenshot] storage error:", error);
            return new Response(JSON.stringify({ error: "Ngarkimi dështoi" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
          return new Response(JSON.stringify({ url: data.publicUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[upload-screenshot] error:", err);
          return new Response(JSON.stringify({ error: "Gabim i papritur" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
