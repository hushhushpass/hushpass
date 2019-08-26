const mongoose = require("mongoose");
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);
const Grid = require("gridfs-stream");
eval(
    `Grid.prototype.findOne = ${Grid.prototype.findOne
    .toString()
    .replace("nextObject", "next")}`
);

const uuidv4 = require("uuid/v4");
const Document = mongoose.model("documents");
const crypto = require("crypto");

mongoose.Promise = global.Promise;
const connection = mongoose.connection;
Grid.mongo = mongoose.mongo;

const moment = require("moment");

async function saveNewDocumentToDB(name, type, key, downloads, expiration) {
    const docId = uuidv4();

    if (!downloads || downloads < 1) {
        downloads = 1;
    } else if (downloads > 100) {
        downloads = 100;
    }

    if (!expiration || expiration < 1) {
        expiration = 1;
    } else if (expiration > 14) {
        expiration = 14;
    }

    await new Document({
        docId: docId,
        fileName: name,
        fileType: type,
        hashedKey: crypto
            .createHash("sha256")
            .update(process.env.SALT + key)
            .digest("hex"),
        maxDownloads: downloads,
        expirationDate: moment().add(expiration, "d")
    }).save();

    return docId;
}

async function saveEncryptedFileToDB(docId, encryptedFileReadStream) {
    const gridFSBucket = await new mongoose.mongo.GridFSBucket(connection.db);
    const writestream = gridFSBucket.openUploadStream(docId, function(err) {
        if (err) {
            console.log(
                "Error in saveEncryptedFileToDB: unable to establish writestream"
            );
            return -1;
        }
    });

    encryptedFileReadStream.pipe(writestream);

    writestream.on("close", function(file) {
        console.log("file added to db");
        return 1;
    });
    writestream.on("error", function(err) {
        console.error("error");
        return -1;
    });
}

async function updateDocumentAfterDownload(docId) {
    Document.findOneAndUpdate({ docId: docId }, {
            $inc: { downloadCount: 1 }
        }, { new: true },
        function(err, response) {
            if (err) {
                console.log(err);
            } else {
                // console.log(response);
            }
        }
    );
}

async function getDocument(docId) {
    return Document.findOne({ docId }, function(err) {
        if (err) {
            console.trace(err);
        }
    });
}

async function readStreamEncryptedFileFromDB(docId) {
    const gridFSBucket = await new mongoose.mongo.GridFSBucket(connection.db);
    const readStream = gridFSBucket.openDownloadStreamByName(docId, function(
        err
    ) {
        if (err) {
            console.log("error in readStreamEncryptedFileFromDB");
            return 0;
        }
    });
    return readStream;
}

module.exports = {
    saveNewDocumentToDB,
    saveEncryptedFileToDB,
    updateDocumentAfterDownload,
    getDocument,
    readStreamEncryptedFileFromDB
};