module.exports = async () => {
  const { pool } = require("./index");
  if (pool) {
    await pool.end();
  }
};
