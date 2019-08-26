const mongoose = require("mongoose");
const moment = require("moment");
const Schema = mongoose.Schema;

const documentsSchema = new Schema({
    docId: { type: String, trim: true },
    fileName: { type: String, trim: true, default: "file" },
    fileType: { type: String },
    hashedKey: String,
    expirationDate: {
        type: Date,
        default: moment().add(1, "d")
    },
    maxDownloads: { type: Number, default: 1 },
    downloadCount: { type: Number, default: 0 },
    maxDownloadsReached: { type: Boolean, default: false },
    dateCreated: { type: Date, default: moment() },
    valid: { type: Boolean, default: true }
});

mongoose.model("documents", documentsSchema);