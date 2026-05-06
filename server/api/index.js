const app = require("../src/index");

module.exports = async (req, res) => {
  return app(req, res);
};