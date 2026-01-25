'use client';

import { useRef, useState } from 'react';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
};

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
  ];

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  function validateFile(file: File): string | null {
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload a PDF or an image file.';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
    }

    return null;
  }

  if (!isOpen) return null;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const selectedFile = input.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      setError(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFile(null);
      setError(validationError);
      input.value = '';
      return;
    }

    setError(null);
    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onUpload(file);
      setFile(null);
      onClose();
    } catch {
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
      <div className='bg-gray-900 rounded-lg p-6 w-full max-w-sm border border-gray-800'>
        <h2 className='text-lg font-semibold mb-4'>Upload document</h2>

        <input ref={inputRef} type='file' name='file' accept='.pdf,.png,.jpg,.jpeg' className='hidden'
          onChange={handleFileChange} />

        <button type='button' onClick={openFilePicker}
          className='w-full border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-500 transition cursor-pointer'>
          {file ? (
            <div>
              <p className='text-sm font-medium'>{file.name}</p>
              <p className='text-sm text-gray-400 mt-2'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ): (
            <div>
              <p className='text-sm font-medium text-gray-400'>Click to select a document</p>
              <p className='text-sm text-gray-400 mt-2'>(.pdf .png .jpg .jpeg)</p>
            </div>
          )}
        </button>

        {error && <p className='text-sm text-red-400 mt-3'>{error}</p>}

        <div className='flex justify-end gap-2 mt-6'>
          <button type='button'
            onClick={onClose}
            disabled={loading}
            className='px-3 py-1 text-sm border border-gray-700 rounded hover:bg-gray-800 enabled:cursor-pointer disabled:cursor-not-allowed'>
            Cancel
          </button>

          <button type='button'
            onClick={handleUpload}
            disabled={!file || loading}
            className='px-3 py-1 text-sm bg-gray-100 text-gray-900 rounded disabled:opacity-50 enabled:cursor-pointer enabled:hover:bg-gray-300 disabled:cursor-not-allowed'>
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
