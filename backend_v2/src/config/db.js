import fs from "fs";
import path from "path";

const dataPath = path.resolve("src/data");

export const readData = (fileName) => {
  const file = path.join(dataPath, `${fileName}.json`);
  const data = fs.readFileSync(file, "utf-8");
  return JSON.parse(data);
};

export const writeData = (fileName, data) => {
  const file = path.join(dataPath, `${fileName}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};