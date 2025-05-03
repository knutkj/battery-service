#!/usr/bin/env node
// Generate Markdown docs and JSON from Kaitai Struct YAML specs.
// Usage: node tools/ksy-to-md-and-json.js <formatsDir>

import fs from "fs/promises";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  root,
  heading,
  paragraph,
  strong,
  table,
  tableRow,
  tableCell,
  text,
  inlineCode,
} from "mdast-builder";
import { unified } from "unified";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import prettier from "prettier";

// Refactored CLI to use yargs command/flags for format selection
const argv = yargs(hideBin(process.argv))
  .command(
    "generate <formatsDir>",
    "Generate files from Kaitai Struct YAML specs.",
    (yargs) =>
      yargs
        .positional("formatsDir", {
          describe: "Directory containing .ksy files.",
          type: "string",
        })
        .option("md", {
          describe: "Generate Markdown files.",
          type: "boolean",
          default: false,
        })
        .option("json", {
          describe: "Generate JSON files.",
          type: "boolean",
          default: false,
        }),
    async (args) => {
      if (!args.md && !args.json) {
        console.error("Specify at least one of --md or --json");
        process.exit(1);
      }
      await generate(args.formatsDir, args.md, args.json);
    },
  )
  .demandCommand(1)
  .help()
  .strict()
  .parse();

// Main generation logic, now as a function
async function generate(formatsDir, doMd, doJson) {
  try {
    await fs.access(formatsDir);
  } catch {
    console.error("Directory not found:", formatsDir);
    process.exit(1);
  }
  const specs = await getAllSpecFiles(formatsDir);
  if (!specs.length) {
    console.log("No .ksy spec files found.");
    return;
  }
  for (const specPath of specs) {
    const mdPath = specPath.replace(/\.ksy$/, ".md");
    const jsonPath = specPath.replace(/\.ksy$/, ".json");
    const relMdPath = path.relative(process.cwd(), mdPath).replace(/\\/g, "/");
    const relJsonPath = path
      .relative(process.cwd(), jsonPath)
      .replace(/\\/g, "/");
    const needsMd = doMd ? await shouldGenerateOut(specPath, mdPath) : false;
    const needsJson = doJson
      ? await shouldGenerateOut(specPath, jsonPath)
      : false;
    if (!needsMd && !needsJson) {
      console.log(`Up-to-date: ${relMdPath}, ${relJsonPath}`);
      continue;
    }
    const spec = await parseSpec(specPath);
    if (!spec) {
      console.error("Failed to parse", specPath);
      continue;
    }
    if (needsMd) {
      const start = Date.now();
      const tree = await specToMarkdownAst(spec, specPath);
      const md = String(
        await unified()
          .use(remarkStringify, { bullet: "-" })
          .use(remarkGfm)
          .run(tree)
          .then((t) =>
            unified()
              .use(remarkStringify, { bullet: "-" })
              .use(remarkGfm)
              .stringify(t),
          ),
      );
      const formattedMd = await formatWithPrettier(md, mdPath);
      if (formattedMd !== md) {
        console.log(`[Prettier ]: ${relMdPath}`);
      }
      await fs.writeFile(mdPath, formattedMd, "utf8");
      const elapsed = Date.now() - start;
      console.log(`[Generated]: ${relMdPath} (${elapsed}ms)`);
    }
    if (needsJson) {
      const start = Date.now();
      let jsonString = JSON.stringify(spec, null, 2);
      const formattedJson = await formatWithPrettier(
        jsonString,
        jsonPath,
        "json",
      );
      if (formattedJson !== jsonString) {
        console.log(`[Prettier ]: ${relJsonPath}`);
      }
      await fs.writeFile(jsonPath, formattedJson, "utf8");
      const elapsed = Date.now() - start;
      console.log(`[Generated]: ${relJsonPath} (${elapsed}ms)`);
    }
  }
}

/**
 * Recursively find all .ksy files in a directory.
 *
 * @param {string} dir - Directory to search.
 * @returns {Promise<string[]>} Array of file paths.
 */
async function getAllSpecFiles(dir) {
  let results = [];
  for (const file of await fs.readdir(dir)) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      // Recurse into subdirectories
      results = results.concat(await getAllSpecFiles(filePath));
    } else if (file.endsWith(".ksy")) {
      results.push(filePath);
    }
  }
  return results;
}

/**
 * Should the Markdown or JSON file be (re)generated based on timestamps?
 *
 * @param {string} ksyPath - Path to the .ksy file.
 * @param {string} outPath - Path to the output file.
 * @returns {Promise<boolean>} True if output should be generated.
 */
async function shouldGenerateOut(ksyPath, outPath) {
  const toolPath = fileURLToPath(import.meta.url);
  try {
    await fs.access(outPath);
  } catch {
    // Output file does not exist
    return true;
  }
  const ksyStat = await fs.stat(ksyPath);
  const outStat = await fs.stat(outPath);
  const toolStat = await fs.stat(toolPath);

  // Regenerate if .ksy or tool is newer than output
  return (
    ksyStat.mtimeMs > outStat.mtimeMs || toolStat.mtimeMs > outStat.mtimeMs
  );
}

/**
 * Parse a KSY (YAML) spec file. Returns parsed object or null on error.
 *
 * @param {string} specPath - Path to the .ksy file.
 * @returns {Promise<Object | null>} Parsed YAML object or null.
 */
async function parseSpec(specPath) {
  try {
    return yaml.load(await fs.readFile(specPath, "utf8"));
  } catch (e) {
    console.error(`Error parsing ${specPath}:`, e);
    return null;
  }
}

/**
 * Convert a Kaitai Struct spec to a Markdown AST (only binary layout section).
 *
 * @param {Object} spec - Parsed Kaitai spec.
 * @param {string} jsonPath - Path to the output JSON file.
 * @returns {Promise<Object>} Markdown AST.
 */
async function specToMarkdownAst(spec, jsonPath) {
  const title =
    (spec.meta && spec.meta.title) || path.basename(jsonPath, ".json");
  const desc = spec.doc || "";
  const children = [heading(1, [text(title)])];
  if (desc)
    children.push(
      paragraph([strong([text("Description:")]), text(" " + desc)]),
    );
  if (spec.seq && spec.seq.length) {
    children.push(heading(2, [text("Binary Layout")]));

    // Flatten the binary layout for the main sequence
    const flatRows = flattenBinaryLayoutKaitai(
      spec.seq,
      spec.types || {},
      spec.enums || {},
    );

    // Build the Markdown table rows
    const tableRows = [
      [[text("Size")], [text("Type")], [text("Values")], [text("Description")]],
      ...flatRows.map((r) => [
        [text(r.bits)],
        [text(r.type)],
        r.values.length ? r.values : [text("")],
        [text(r.description)],
      ]),
    ];
    children.push(
      table(
        ["right", null, null, null],
        tableRows.map((row) => tableRow(row.map((cell) => tableCell(cell)))),
      ),
    );
  }
  return root(children);
}

/**
 * Format content using Prettier if possible, otherwise return original.
 *
 * @param {string} content - The content to format.
 * @param {string} filepath - The file path (used for Prettier config and parser
 *   inference).
 * @param {string} [parser] - Optional parser override (e.g., 'json').
 * @returns {Promise<string>} Formatted content or original if formatting fails.
 */
async function formatWithPrettier(content, filepath, parser) {
  try {
    const prettierConfig = await prettier.resolveConfig(
      process.cwd() + "/.prettierrc",
    );
    return await prettier.format(content, {
      ...prettierConfig,
      filepath,
      ...(parser ? { parser } : {}),
    });
  } catch (e) {
    // If Prettier fails, log error but continue
    console.error("[Prettier] Failed to format", filepath, e);
    return content;
  }
}

/**
 * Flatten the binary layout for a structure, inlining nested types.
 *
 * @param {Array} seq - Sequence array from Kaitai spec.
 * @param {Object} types - Types defined in the Kaitai spec.
 * @param {Object} enums - Enums defined in the Kaitai spec.
 * @returns {Array} Array of row objects for the table.
 */
function flattenBinaryLayoutKaitai(seq, types, enums) {
  let rows = [];
  for (const f of seq) {
    // Inline nested types by recursion
    if (types && f.type && types[f.type]?.seq) {
      rows = rows.concat(
        flattenBinaryLayoutKaitai(types[f.type].seq, types, enums),
      );
      continue;
    }
    let [bits] = getBitWidth(f.type);
    const typeStr = f.type || "";
    let values = [];

    // Special handling for boolean bit fields
    if (f.type === "b1") {
      values = [
        inlineCode("true"),
        { type: "text", value: ", " },
        inlineCode("false"),
      ];
    } else if (f.enum && enums && enums[f.enum]) {
      // If field uses an enum, list possible values
      values = Object.values(enums[f.enum])
        .map((v, i, arr) => [
          inlineCode(
            `"${typeof v === "object" && v.id ? String(v.id) : String(v)}"`,
          ),
          ...(i < arr.length - 1 ? [{ type: "text", value: ", " }] : []),
        ])
        .flat();
    }

    // Replace newlines in doc with spaces for table
    const desc = f.doc ? f.doc.replace(/\n/g, " ") : "";
    rows.push({
      bits: bits ? String(bits) : "?",
      type: typeStr,
      values,
      description: desc,
    });
  }
  return rows;
}

/**
 * Get bit width for a Kaitai type string (e.g., b1, u2, etc.).
 *
 * @param {string} type - Kaitai type string.
 * @returns {[number | null, string]} Tuple of bit width and type string.
 */
function getBitWidth(type) {
  if (!type || typeof type !== "string") return [null, type];
  if (type.startsWith("b")) return [parseInt(type.slice(1), 10), type];
  if (["u", "s", "f"].includes(type[0])) {
    const n = parseInt(type.slice(1), 10);
    if (!isNaN(n)) return [n * 8, type];
  }
  return [null, type];
}
