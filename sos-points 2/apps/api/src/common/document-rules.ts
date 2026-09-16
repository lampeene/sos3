/**
 * Business rules for required documents per registration case.
 * Based on French driving license points recovery regulations.
 */

export type CaseNumber = 'CASE_1' | 'CASE_2' | 'CASE_3' | 'CASE_4';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

/**
 * Documents required for each case.
 */
export const DOCUMENT_REQUIREMENTS: Record<
  CaseNumber,
  {
    drivingLicense: boolean; // unless noLicense
    docCat2: boolean; // letter 48N
    docCat3Cat4: boolean; // judgement / ordonnance
    description: string;
  }
> = {
  CASE_1: {
    drivingLicense: true,
    docCat2: false,
    docCat3Cat4: false,
    description: 'Points restants uniquement – permis requis',
  },
  CASE_2: {
    drivingLicense: true,
    docCat2: true,
    docCat3Cat4: false,
    description: 'Lettre 48N reçue – permis + lettre 48N requis',
  },
  CASE_3: {
    drivingLicense: true,
    docCat2: false,
    docCat3Cat4: true,
    description: 'Ordonnance / décision judiciaire – permis + jugement requis',
  },
  CASE_4: {
    drivingLicense: true,
    docCat2: false,
    docCat3Cat4: true,
    description: 'Alternative aux poursuites – permis + document requis',
  },
};

export function isAllowedMimeType(mime: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime.toLowerCase());
}

export function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}
