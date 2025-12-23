const swaggerJsDoc = require("swagger-jsdoc");
const comps = require("../docs/swaggerComponents");

const opts = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Radiation Monitoring", version: "1.0.0" },
    tags: comps.tags,
    components: comps.components,
  },
  apis: ["./routes/**/*.js"],
};

const spec = swaggerJsDoc(opts);

console.log(
  "Defined tags:",
  (spec.tags || []).map((t) => t.name)
);

const paths = spec.paths || {};
const untagged = [];
let total = 0;
for (const p of Object.keys(paths)) {
  for (const m of Object.keys(paths[p])) {
    total++;
    const op = paths[p][m];
    const tags = op.tags || [];
    console.log(`${m.toUpperCase()} ${p} -> tags=${JSON.stringify(tags)}`);
    if (!tags.length) untagged.push({ path: p, method: m });
  }
}
console.log("\nTotal operations:", total);
console.log("Untagged operations:", untagged);

const fs = require("fs");
fs.writeFileSync("./api-docs-generated.json", JSON.stringify(spec, null, 2));
console.log("\nWrote ./api-docs-generated.json");
