// Read-only export of the two application buckets. Run in a protected terminal.
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const destination = process.argv[2];
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !destination) {
  throw new Error("Provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a destination directory.");
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const buckets = ["catalogo-produtos", "site-assets"];
const manifest = [];
await mkdir(destination, { recursive: true });

async function exportFolder(bucket, prefix = "") {
  let offset = 0;
  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: 100, offset, sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id == null) {
        await exportFolder(bucket, path);
        continue;
      }
      const { data: blob, error: downloadError } = await client.storage.from(bucket).download(path);
      if (downloadError) throw downloadError;
      const target = join(destination, bucket, ...path.split("/"));
      await mkdir(join(target, ".."), { recursive: true });
      await writeFile(target, Buffer.from(await blob.arrayBuffer()));
      manifest.push({ bucket, path, size: blob.size });
    }
    if (data.length < 100) break;
    offset += data.length;
  }
}

for (const bucket of buckets) await exportFolder(bucket);
await writeFile(join(destination, "storage-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Exported ${manifest.length} objects.`);
