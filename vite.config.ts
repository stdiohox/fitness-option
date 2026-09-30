import { existsSync } from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Serves api/*.ts in `npm run dev` with the same Web Request/Response signature Vercel uses,
// so the enquiry agent works locally without `vercel dev` or a Vercel login.
function devApi(): Plugin {
  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/", async (req, res) => {
        const route = (req.url ?? "").split("?")[0]?.replace(/^\//, "");
        if (!route || !/^[a-z-]+$/.test(route)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        if (!existsSync(`${server.config.root}/api/${route}.ts`)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${route}.ts`);
          const handler = mod[req.method ?? "GET"] as ((r: Request) => Promise<Response>) | undefined;
          if (!handler) {
            res.statusCode = 405;
            res.end();
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.config.logger.error(String(error));
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose .env.local server-side to the dev API only; nothing here is sent to the browser.
  // Variables already set in the shell win.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    process.env[key] ??= value;
  }
  return { plugins: [react(), tailwindcss(), devApi()] };
});
