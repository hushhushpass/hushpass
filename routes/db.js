const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
eval(
  `Grid.prototype.findOne = ${Grid.prototype.findOne
    .toString()
    .replace("nextObject", "next")}`
);

const fs = require("fs");
const crypto = require("crypto");

const formidable = require("formidable");
const uuidv4 = require("uuid/v4");
const Document = mongoose.model("documents");

mongoose.Promise = global.Promise;
const connection = mongoose.connection;
Grid.mongo = mongoose.mongo;

const moment = require("moment");

router.post("/upload", function(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async function(err, fields, files) {
    const docId = uuidv4();
    const newDoc = await new Document({
      docId: docId,
      fileName: files["file"].name,
      fileType: files["file"].type,
      hashedKey: crypto
        .createHash("sha256")
        .update(fields.key)
        .digest("hex"),
      userID: req.userID,
      maxDownloads: fields.downloads ? fields.downloads : 1,
      expirationDate: fields.expiration
        ? moment().add(fields.expiration, "d")
        : moment().add(1, "d")
    }).save();

    const cipher = crypto.createCipher("aes-256-cbc", fields.key);
    const input = fs.createReadStream(files["file"].path);

    const encryptedFilePath = files["file"].path + ".enc";
    const output = fs.createWriteStream(encryptedFilePath);

    input.pipe(cipher).pipe(output);

    //FILE HAS BEEN SUCCESSFULLY ENCRYPTED
    output.on("finish", function() {
      console.log("Encrypted file written to disk!");
      const gridfs = Grid(connection.db, mongoose.mongo);

      const writestream = gridfs.createWriteStream({
        filename: docId
      });

      fs.createReadStream(encryptedFilePath).pipe(writestream);

      writestream.on("close", function(file) {
        console.log("file added to db");
      });
      writestream.on("error", function(err) {
        console.error("error");
        res.status(500).end();
      });

      return res.status(200).send(docId);
    });
  });
});

router.get("/:documentCode", async function(req, res) {
  const docId = req.params.documentCode;
  const document = await Document.findOne({ docId: docId }, function(err, doc) {
    if (err) {
      // console.error(err);
      res.status(404).send("Error getting Document from Database");
    }
  });

  res.status(200).send({
    fileName: document.fileName,
    fileType: document.fileType,
    expirationDate: moment(document.expirationDate).format("dddd, MMMM Do YYYY")
  });
});

router.post("/file/:documentCode", async function(req, res) {
  // console.log('*** arived in get db/file ***');
  // console.log('body:',req.body);
  const docId = req.params.documentCode;

  const form = new formidable.IncomingForm();

  form.parse(req, async function(err, fields) {
    const document = await Document.findOne({ docId: docId }, function(
      err,
      doc
    ) {
      if (err) return console.error(err);
    });

    const hash = crypto
      .createHash("sha256")
      .update(fields.password)
      .digest("hex");

    // valid document and password checks
    if (hash != document.hashedKey) return res.status(401).send("Bad password");
    if (moment().isAfter(document.expirationDate)) {
      Document.findOneAndUpdate({ docId: docId }, { valid: false }, function(
        err,
        file
      ) {
        if (err) {
          console.log("error occured when updating file:", docId);
        }
      });
      return res.status(404).send("File no longer available");
    }
    if (document.valid) return res.status(404).send("File no longer available");

    const gridfs = await Grid(connection.db, mongoose.mongo);

    gridfs.findOne({ filename: docId }, function(err, file) {
      if (err) return res.status(400).send(err);
      else if (!file) {
        return res
          .status(404)
          .send("Error on the database looking for the file.");
      }

      res.set("Content-Type", document.fileType);
      res.set(
        "Content-Disposition",
        'attachment; filename="' + document.fileName + '"'
      );

      const cipher = crypto.createDecipher("aes-256-cbc", fields.password);
      const readstream = gridfs.createReadStream({ filename: docId });
      readstream.pipe(cipher).pipe(res);

      readstream
        .on("end", function() {
          console.log(
            "stream end, updating doc downloads:",
            document.downloadCount + 1
          );
          const validState =
            document.downloadCount + 1 < dowcument.maxDownloads;
          Document.findOneAndUpdate(
            { docId: docId },
            { downloadCount: document.downloadCount + 1, valid: validState },
            function(err, doc) {
              if (err) console.log(err);
              else console.log("Succesfully saved");
              if (!validState) console.log("File marked invalid");
            }
          );
        })
        .on("error", function(err) {
          res.end();
        });
    });
  });
});

module.exports = router;
