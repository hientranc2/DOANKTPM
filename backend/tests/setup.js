const { pool } = require("../index");

afterAll(async () => {
  await pool.end();
});
