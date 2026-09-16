'use client';

import { useState, useRef } from 'react';
import { getToken } from '@/lib/auth';
import { validateFile, MAX_FILE_SIZE_MB } from '@/lib/document-validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type UploadResult = {
  publicId: string;
  url: string;
  format: string;
  originalFilename?: string;
  mimeType?: string;
};

type Props = {
  label?: string;
  accept?: string;
  folder?: string;
  required?: boolean;
  onUploaded: (result: UploadResult) => void;
  onError?: (message: string) => void;
};

export default function FileUpload({
  label = 'Choisir un fichier',
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  folder = 'sos-points',
  required = false,
  onUploaded,
  onError,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError('');
    setFileName('');
    setPreview(null);

    // Client-side validation
    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      onError?.(validationError);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Vous devez être connecté pour uploader un fichier');
      }

      const sigRes = await fetch(`${API_URL}/storage/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder }),
      });

      if (!sigRes.ok) {
        const err = await sigRes.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible d’obtenir la signature');
      }

      const sig = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          'POST',
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        );

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            onUploaded({
              publicId: data.public_id,
              url: data.secure_url,
              format: data.format,
              originalFilename: data.original_filename,
              mimeType: file.type,
            });
            resolve();
          } else {
            reject(new Error('Échec de l’upload Cloudinary'));
          }
        };

        xhr.onerror = () => reject(new Error('Erreur réseau'));
        xhr.send(formData);
      });
    } catch (err: any) {
      const msg = err.message || 'Erreur d’upload';
      setLocalError(msg);
      onError?.(msg);
      setFileName('');
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <p className="text-xs text-gray-500">
        Formats acceptés : JPG, PNG, WebP, PDF – Max {MAX_FILE_SIZE_MB} Mo
      </p>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-[#08717e] hover:bg-teal-50 transition">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? `Upload... ${progress}%` : 'Choisir un fichier'}
        </label>

        {fileName && !uploading && !localError && (
          <span className="text-sm text-green-700 truncate max-w-[200px]">
            ✓ {fileName}
          </span>
        )}
      </div>

      {localError && (
        <p className="text-sm text-red-600">{localError}</p>
      )}

      {uploading && (
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-[#08717e] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {preview && (
        <img
          src={preview}
          alt="Aperçu"
          className="mt-2 h-24 w-auto rounded-lg border object-cover"
        />
      )}
    </div>
  );
}
