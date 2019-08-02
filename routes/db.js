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
    if (files.file.size > 24500000) {
      console.log("File is too large");
      // Sending a proper 401 or 500 status crashes the backend.
      res.status(200).send("File is too large");
    }

    const docId = uuidv4();
    const newDoc = await new Document({
      docId: docId,
      fileName: files["file"].name,
      fileType: files["file"].type,
      hashedKey: crypto
        .createHash("sha256")
        .update(process.env.SALT + fields.key)
        .digest("hex"),
      userID: req.userID,
      maxDownloads: fields.downloads ? fields.downloads : 1,
      expirationDate: fields.expiration
        ? moment().add(fields.expiration, "d")
        : moment().add(1, "d")
    }).save();

    let realKey = crypto.scryptSync(fields.key, process.env.SALT, 32);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      realKey,
      Buffer.from(process.env.SALT, "ascii")
        .toString("hex")
        .slice(0, 16)
    );
    const input = fs.createReadStream(files["file"].path);

    const encryptedFilePath = files["file"].path + ".enc";
    const output = fs.createWriteStream(encryptedFilePath);

    input.pipe(cipher).pipe(output);

    //FILE HAS BEEN SUCCESSFULLY ENCRYPTED
    output.on("finish", function() {
      // console.log("Encrypted file written to disk!");
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
        res.status(200).send("Could not add file to db");
      });

      return res.status(200).send(docId);
    });
  });
});

router.get("/:documentCode", async function(req, res) {
  const docId = req.params.documentCode;
  const document = await Document.findOne({ docId: docId }, function(err, doc) {
    if (err) {
      console.error(err);
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
  const docId = req.params.documentCode;

  const form = new formidable.IncomingForm();

  form.parse(req, async function(err, fields) {
    const document = await Document.findOne({ docId: docId }, function(
      err,
      doc
    ) {
      if (err) return console.error(err);
    });
    const docStatus = (document => {
      if (
        document.maxDownloads <= document.downloadCount ||
        document.maxDownloadsReached
      ) {
        return "DocLimit";
      } else if (moment(document.expirationDate) <= moment()) {
        return "Expired";
      }

      return "";
    })(document);

    if (docStatus === "Expired") {
      return res.status(421).send({
        error: "Document has been expired."
      });
    }

    if (docStatus === "DocLimit") {
      if (!document.maxDownloadsReached) {
        Document.findOneAndUpdate(
          {
            docId
          },
          {
            $set: {
              maxDownloadsReached: true
            }
          },
          { new: true },
          result => {
            // console.log(result);
          }
        );
      }
      return res.status(411).send({
        error:
          "The maximum number of downloads has been reached for this document."
      });
    } else {
    }

    const hash = crypto
      .createHash("sha256")
      .update(process.env.SALT + fields.password)
      .digest("hex");

    if (hash != document.hashedKey) return res.status(401).send("Bad password");

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

      let realKey = crypto.scryptSync(fields.password, process.env.SALT, 32);
      const cipher = crypto.createDecipheriv(
        "aes-256-cbc",
        realKey,
        Buffer.from(process.env.SALT, "ascii")
          .toString("hex")
          .slice(0, 16)
      );
      const readstream = gridfs.createReadStream({ filename: docId });
      readstream.pipe(cipher).pipe(res);

      readstream.on("end", function() {
        Document.findOneAndUpdate(
          {
            docId
          },
          {
            $set: {
              downloadCount: document.downloadCount + 1
            }
          },
          { new: true },
          result => {
            // console.log(result);
          }
        );

        res.end();
      });

      readstream.on("error", function(err) {
        console.error("error");
        res.end();
      });
    });
  });
});

module.exports = router;
