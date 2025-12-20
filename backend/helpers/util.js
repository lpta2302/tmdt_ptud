const fs = require("fs");
const path = require("path");

function getFilePath(collection) {
  return path.join(__dirname, "data", `${collection}.json`);
}

function readDB(collection) {
  const file = getFilePath(collection);

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]"); // tự động tạo file rỗng
  }

  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeDB(collection, data) {
  const file = getFilePath(collection);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
