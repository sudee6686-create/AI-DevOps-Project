
const { test } = require("node:test");
const assert = require("node:assert/strict");

test("DevGenAI backend home route responds correctly", async () => {
  const response = await fetch("http://127.0.0.1:5000/");

  assert.equal(response.status, 200);

  const body = await response.text();
  assert.equal(body, "DevGenAI Backend Running");
});
