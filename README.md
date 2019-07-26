# [HushHush](https://hush-hush.herokuapp.com)

Share sensitive documents without worrying about them falling into the wrong hands with our encrypted file share service.

# [Trello Tasks](https://trello.com/b/w49VErwh/development)


# Problem Statement

We saw a need to send sensitive documents and feel safe about it. Other solutions didn't have the same ease of use that we've come to expect. We felt uncomfortable sending sensitive documents as email attachments or sharing them through google drive.

These solutions didn’t allow us to set an expiration date nor a download limit. Should the recipient’s email get hacked, your social security number, bank account numbers, or other sensitive information could be compromised.

# Idea/Solution

We wanted a service in which we knew how our data was stored. And, in the case of the data from the db being leaked, we’d also like that information be entirely useless to attackers. Now that data breaches are a common occurrence, it’s impossible to trust even brand named software. Furthermore, even if the data is stored completely securely on the application, there’s no way to be sure whether the document’s recipient will ever have their email or accounts compromised.

To solve this problem, we created a product which would satisfy the following criteria:
Store client information in a secure fashion
Have documents to expire after a given date
Limit documents to a specified number of downloads
Remove client document data entirely once it has exceeded its expiration and download limits.

# Installation Guide

Create a .env file and populate it with the fields shown in .env.sample

Npm install

# Implementation

Our interest in your files content stops at its name and type. We only collect that information so that you and your intended recipient both know what’s being delivered. This data is saved separately from the actual file, so that it can be accessed separately from the file.

```javascript
const newDoc = await new Document({
     docId: docId,
     fileName: files["file"].name,
     fileType: files["file"].type,
     hashedKey: crypto
       createHash("sha256")
       update(process.env.SALT + fields.key)
       digest("hex"),
     userID: req.userID,
     maxDownloads: fields.downloads ? fields.downloads : 1,
     expirationDate: fields.expiration
       ? moment().add(fields.expiration, "d")
       : moment().add(1, "d")
   }).save();
```

Our site reads and encrypts the file at the same time. We establish the encryption, file read stream, and output so that we can apply all three uninterrupted.

```javascript
const cipher = crypto.createCipheriv(
  "aes-256-cbc",
  realKey,
  Buffer.from(process.env.SALT, "ascii")
    toString("hex")
    slice(0, 16)
);
const input = fs.createReadStream(files["file"].path);
const encryptedFilePath = files["file"].path + ".enc";
const output = fs.createWriteStream(encryptedFilePath);
input.pipe(cipher).pipe(output);
```

Finally when we’re delivering the file, we read the encrypted file from the database, directly into the decryptor, then to the user (res).

```javascript
const readstream = gridfs.createReadStream({ filename: docId });
readstream.pipe(cipher).pipe(res);
```

# Future Goals

(in no particular order)

- File Compression. Perhaps as an option for oversized files, or as a requirement if our database usage grows to large.

- Accounts and Logins. We can make it possible to track how many downloads are left on a file, how long till it expires, and add the ability to terminate a file early. Also keeps a history of uploads.

- Batch Uploads. Upload a file once and receive multiple download links. Useful for sending a file to multiple people using different links.

# FAQ

#### Q: How many times can people download my file? What is the maximum?

A: We default the downloads to 1 per file and we have a cap at 100 downloads. This is a small project meant as an example, rather than a full scale application, so we tried to limit its use.

#### Q: How long will you keep my file? What is the longest time you will store it?

A: We default to one day, which is a 24 hour period starting from the time you upload the file. We cap the time at 2 weeks, because while we want people to use our service we do not have the storage space to be a long term file storage solution.

#### Q: How safe is my file? What’s your encryption algorithm?

A: It is safe, we never look at the contents of your file, other than its name, type, and size. Our app uses the Advanced Encryption Standard to encrypt your file as soon as we have it, and only store it on our database after its encrypted. AES is the same algorithm used by the US government to secure sensitive documents. [Learn more about AES here.](https://aesencryption.net/)

#### Q: Can I upload illegal material? Why not?

A: No, you cannot legally use our service for illegal means. The internet is not some sovereign entity where the police, FBI, and other law enforcement can’t reach. If we suspect our service is being used for anything even remotely unwholesome we will inform authorities.

# Built With

```
Mongo DB
    GridFS
    Mongoose

Node.js
    Express
    Crypto
    Formidable

React
    Axios
    React Dropzone
    Moment.js

AWS Lambda
```

# Authors

[Andrew Patterson](https://github.com/andrewpat24)

[Peter Malolepszy](https://github.com/pmalolep)
