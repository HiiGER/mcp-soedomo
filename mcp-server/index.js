import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "..");

/** Scan semua *.md di DOCS_DIR */
function scanDocs() {
  return readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const content = readFileSync(join(DOCS_DIR, f), "utf-8");
      const h1 = content.match(/^#\s+(.+)/m)?.[1] ?? f;
      return { file: f, title: h1, content };
    });
}

const server = new Server(
  { name: "dokumentasi-soedomo", version: "1.0.0" },
  { capabilities: { resources: {}, tools: {} } }
);

// ── Resources: tiap .md = 1 resource ────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const docs = scanDocs();
  return {
    resources: docs.map((d) => ({
      uri: `soedomo://docs/${d.file}`,
      name: d.title,
      description: `Dokumentasi: ${d.file}`,
      mimeType: "text/markdown",
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const file = req.params.uri.replace("soedomo://docs/", "");
  const path = join(DOCS_DIR, file);
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    throw new Error(`Dokumen tidak ditemukan: ${file}`);
  }
  return {
    contents: [{ uri: req.params.uri, mimeType: "text/markdown", text: content }],
  };
});

// ── Stage → dokumen mapping (sinkron dengan index.md) ───────────────────────

const STAGE_MAP = {
  "1": ["database-style.md", "database-helper.md"],
  "2": ["database-helper.md", "erm.md"],
  "3": ["erm.md", "list-cetak.md"],
  "4": ["modal-style.md", "panduan-erm-mulus.md"],
  "5": ["modal-style.md", "panduan-erm-mulus.md"],
  "6": ["list-cetak.md", "panduan-erm-mulus.md"],
  "7": ["solve-eror.md"],
  "8": ["sop-verifikasi-system-analyst.md"],
};

const STAGE_LABELS = {
  "1": "Database Schema & Audit Logs",
  "2": "Model & DataTables Server-Side",
  "3": "Controller HMVC",
  "4": "UI Modal Level 1 - List History",
  "5": "UI Modal Level 2 - Form Input",
  "6": "Lembar Cetak PDF Dompdf",
  "7": "Verifikasi & Handling Error",
  "8": "Quality Gate & Verifikasi System Analyst",
};

// ── Tools ────────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_docs",
      description: "List semua dokumen beserta judul dan nama file.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "search_docs",
      description: "Cari teks di semua dokumen. Return nama file, nomor baris, dan baris yang cocok.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Teks yang dicari (case-insensitive)" },
        },
        required: ["query"],
      },
    },
    {
      name: "read_doc",
      description: "Baca isi lengkap satu dokumen berdasarkan nama file.",
      inputSchema: {
        type: "object",
        properties: {
          file: { type: "string", description: "Nama file, contoh: database-style.md" },
        },
        required: ["file"],
      },
    },
    {
      name: "get_context",
      description:
        "Ambil semua dokumentasi relevan untuk tahap pengerjaan ERM tertentu (1-8). " +
        "Gunakan ini sebelum mengerjakan modul agar konteks lengkap dan tepat sasaran. " +
        "Tahap: 1=Database, 2=Model, 3=Controller, 4=UI List Modal, 5=UI Form Modal, 6=PDF Cetak, 7=Error Handling, 8=Quality Gate.",
      inputSchema: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            description: "Nomor tahap ERM (1-8)",
            enum: ["1", "2", "3", "4", "5", "6", "7", "8"],
          },
        },
        required: ["stage"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "list_docs") {
    const docs = scanDocs();
    const text = docs.map((d) => `- **${d.file}**: ${d.title}`).join("\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "search_docs") {
    const query = (args?.query ?? "").toLowerCase();
    if (!query) throw new Error("Parameter 'query' wajib diisi.");
    const docs = scanDocs();
    const results = [];
    for (const d of docs) {
      const lines = d.content.split("\n");
      lines.forEach((line, i) => {
        if (line.toLowerCase().includes(query)) {
          results.push(`${d.file}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    const text = results.length
      ? results.join("\n")
      : `Tidak ada hasil untuk "${args.query}".`;
    return { content: [{ type: "text", text }] };
  }

  if (name === "read_doc") {
    const file = args?.file;
    if (!file) throw new Error("Parameter 'file' wajib diisi.");
    const path = join(DOCS_DIR, basename(file)); // basename: cegah path traversal
    let content;
    try {
      content = readFileSync(path, "utf-8");
    } catch {
      throw new Error(`Dokumen tidak ditemukan: ${file}`);
    }
    return { content: [{ type: "text", text: content }] };
  }

  if (name === "get_context") {
    const stage = args?.stage;
    if (!stage || !STAGE_MAP[stage]) throw new Error(`Stage tidak valid: ${stage}. Gunakan 1-8.`);
    const files = STAGE_MAP[stage];
    const label = STAGE_LABELS[stage];
    const parts = [`# Konteks Tahap ${stage}: ${label}\n`];
    for (const f of files) {
      const path = join(DOCS_DIR, f);
      let content;
      try {
        content = readFileSync(path, "utf-8");
      } catch {
        content = `_(file tidak ditemukan: ${f})_`;
      }
      parts.push(`\n---\n## 📄 ${f}\n\n${content}`);
    }
    return { content: [{ type: "text", text: parts.join("") }] };
  }

  throw new Error(`Tool tidak dikenal: ${name}`);
});

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
