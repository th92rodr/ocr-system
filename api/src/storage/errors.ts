export class DocumentUploadError extends Error {
  constructor(error: Error) {
    super('Document upload error: ' + error.message);
    this.name = 'DocumentUploadError';
  }
}

export class DocumentDownloadError extends Error {
  constructor(error: Error) {
    super('Document download error: ' + error.message);
    this.name = 'DocumentDownloadError';
  }
}

export class DocumentDeleteError extends Error {
  constructor(error: Error) {
    super('Document delete error: ' + error.message);
    this.name = 'DocumentDeleteError';
  }
}
