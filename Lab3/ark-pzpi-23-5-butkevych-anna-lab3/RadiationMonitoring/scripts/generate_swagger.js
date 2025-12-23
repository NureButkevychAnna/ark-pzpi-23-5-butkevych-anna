const { tags, components } = require("../docs/swaggerComponents");

const spec = {
  openapi: "3.0.0",
  info: { title: "temp", version: "0.0.0" },
  tags,
  components,
};

console.log("PATHS:");
console.log(Object.keys(spec.paths || {}).join("\n"));
console.log("\n--- full spec written to ./api-docs.generated.json");
const fs = require("fs");
fs.writeFileSync("./api-docs.generated.json", JSON.stringify(spec, null, 2));
console.log("done");
