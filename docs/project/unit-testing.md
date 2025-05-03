# Node.js Built-in Unit Tests

This project uses the built-in test runner in Node.js (v18+). No external
libraries or dependencies are required.

## Writing a Test

Create a file ending in `.test.js`, for example:

```js
// example.test.js
import { describe, it } from "node:test";
import assert from "node:assert";

describe("Math operations", () => {
  it("adds numbers", () => {
    assert.strictEqual(1 + 1, 2);
  });

  it("multiplies numbers", () => {
    assert.strictEqual(2 * 3, 6);
  });
});
```

- Use `it` to define individual tests.
- Use `describe` to group related tests together (optional).

## Running Tests

Run all tests with:

```bash
node --test
```

Node will automatically find and run all `.test.js` files.
