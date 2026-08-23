import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFolioServer } from "../server.js";

test("production app shell serves the React workspace with defensive headers", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-frontend-"));
  const app = createFolioServer({
    platformDbPath: join(root, "platform.db"),
    tenantDir: join(root, "tenants"),
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    rmSync(root, { recursive: true, force: true });
  });

  const response = await fetch(origin);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /\/build\/folio-app\.js/);
  assert.doesNotMatch(html, /\/app\.js/);
  assert.doesNotMatch(html, /unsafe-inline|onclick=|onload=/i);

  const bundle = await fetch(`${origin}/build/folio-app.js`);
  assert.equal(bundle.status, 200);
  assert.match(bundle.headers.get("content-type"), /text\/javascript/);
  assert.ok(
    Number(bundle.headers.get("content-length") || (await bundle.arrayBuffer()).byteLength) > 0,
  );
});
