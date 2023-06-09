const fs = require('fs');
const archiver = require('archiver');
const AWS = require('aws-sdk');
const glob = require('glob');

const s3 = new AWS.S3();

// Create a zip file
const output = fs.createWriteStream('.serverless/gimme-time-dev.zip');
const archive = archiver('zip', { zlib: { level: 9 } });
output.on('close', () => {
  console.log('Zip file created successfully');
  // Upload the zip file to S3
  const uploadParams = {
    Bucket: 'gimme-time-artifact-v1',
    Key: 'gimme-time-dev.zip',
    Body: fs.createReadStream('.serverless/gimme-time-dev.zip')
  };
  s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.error('Error uploading zip file to S3:', err);
    } else {
      console.log('Zip file uploaded successfully:', data.Location);
    }
  });
});

archive.pipe(output);

// Get all files and directories inside the 'code' folder
const files = glob.sync('code/**', { dot: true });

// Add files and directories to the archive while maintaining the directory structure
files.forEach((file) => {
  const stats = fs.statSync(file);
  if (stats.isFile()) {
    const fileContent = fs.readFileSync(file);
    archive.append(fileContent, { name: file.replace('code/', '') });
  } else if (stats.isDirectory()) {
    archive.directory(file, file.replace('code/', ''));
  }
});

archive.finalize();
