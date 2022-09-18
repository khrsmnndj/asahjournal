const path = require("path");
const fs = require("fs");
const aws = require("aws-sdk");

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET,
} = require("../config/config");

aws.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const bucketParams = AWS_S3_BUCKET;

const s3 = new aws.S3();

exports.uploadToS3 = (folder, file, newname, next) => {
  const fileStream = fs.createReadStream(file.tempFilePath);
  console.log(file.tempFilePath);
  const uploadParams = {
    Bucket: bucketParams,
    Body: fileStream,
    Key: `${folder}/${newname}`,
  };
  s3.upload(uploadParams, (error, data) => {
    console.log(error, data);
    next(error, data);
  });
};

exports.getFileFromS3 = (folder, key) => {
  const downloadParams = {
    Key: `${folder}/${key}`,
    Bucket: bucketParams,
  };
  return s3.getObject(downloadParams).createReadStream();
};
exports.getFileDefaultFromS3 = (folder, key) => {
  const downloadParams = {
    Key: `${folder}/default/${key}`,
    Bucket: bucketParams,
  };
  return s3.getObject(downloadParams).createReadStream();
};

//delete file from s3 bucker
exports.deleteFileFromS3 = (folder, key, next) => {
  const deleteParams = {
    Key: `${folder}/${key}`,
    Bucket: bucketParams,
  };
  if (key.includes("default")) {
    console.log("default file");
  } else {
    s3.deleteObject(deleteParams, (error, data) => {
      next(error, data);
    });
  }
};
