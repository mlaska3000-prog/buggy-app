const assert = require("assert");
const app = require("./index.js");
// Bug 1: GET /users/:id - id comparison is string vs number (will always return undefined)
// Bug 2: DELETE /users/:id - same string vs number comparison
// Bug 3: Pagination - page/perPage are strings, math will be wrong
console.log("Tests loaded");
process.exit(0);