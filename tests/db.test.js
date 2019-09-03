/**
 * @jest-environment node
 */

require("dotenv").config();
require("../models/Documents");
const moment = require("moment");
const mdb = require("../services/MongoDB/index.js");

beforeAll(() => {});

test("Database Test: check connection", async () => {
  const data = await mdb.checkConnection();
  expect(data).toBeGreaterThan(0);
});

test("Database Test: save and recover document", async () => {
  name = "1";
  type = "txt";
  key = "1";
  downloads = 1;
  expiration = 1;
  const docId = await mdb.saveNewDocumentToDB(
    name,
    type,
    key,
    downloads,
    expiration
  );
  const document = await mdb.getDocument(docId);
  await expect([
    name,
    type,
    downloads,
    moment()
      .add(expiration, "d")
      .format("YYYY MM DD")
  ]).toStrictEqual([
    document.fileName,
    document.fileType,
    document.maxDownloads,
    moment(document.expirationDate).format("YYYY MM DD")
  ]);
});

// test("Database Test: save and recover file",async ()=>{
//   const inputStream;
//   await mdb.saveEncryptedFileToDB("test-file",inputStream);
//   const outputStream = mdb.readStreamEncryptedFileFromDB("test-file");

// })

afterAll(async () => {
  await mdb.closeConnection();
  console.log("connection closed");
});
