/**
 * Client-side document validation rules
 * (mirrors backend rules for better UX)
 */

export type CaseNumber = 'CASE_1' | 'CASE_2' | 'CASE_3' | 'CASE_4';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const CASE_LABELS: Record<CaseNumber, string> = {
  CASE_1: 'Cas 1 – Points restants uniquement',
  CASE_2: 'Cas 2 – Lettre 48N reçue',
  CASE_3: 'Cas 3 – Ordonnance / Décision judiciaire',
  CASE_4: 'Cas 4 – Alternative aux poursuites',
};

export const DOCUMENT_REQUIREMENTS: Record<
  CaseNumber,
  {
    drivingLicense: boolean;
    docCat2: boolean;
    docCat3Cat4: boolean;
    description: string;
  }
> = {
  CASE_1: {
    drivingLicense: true,
    docCat2: false,
    docCat3Cat4: false,
    description: 'Permis de conduire requis',
  },
  CASE_2: {
    drivingLicense: true,
    docCat2: true,
    docCat3Cat4: false,
    description: 'Permis + lettre 48N requis',
  },
  CASE_3: {
    drivingLicense: true,
    docCat2: false,
    docCat3Cat4: true,
    description: 'Permis + jugement / ordonnance requis',
  },
  CASE_4: {
    drivingLicense: true,
    docCat2: false,
    docCat3Cat4: true,
    description: 'Permis + document d’alternative aux poursuites requis',
  },
};

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo)`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Format non autorisé. Utilisez JPG, PNG, WebP ou PDF.';
  }
  return null;
}

export type FormDocuments = {
  caseNumber: string;
  noLicense?: boolean;
  licenseUrl?: string;
  licenseFileName?: string;
  doc48nUrl?: string;
  doc48nFileName?: string;
  letterNumber?: string;
  letterCode?: string;
  judgementUrl?: string;
  judgementFileName?: string;
  judgementNumber?: string;
  dateOfJudgement?: string;
};

/**
 * Validate that all required documents for the selected case are present.
 * Returns an array of error messages (empty = OK).
 */
export function validateDocumentsForCase(form: FormDocuments): string[] {
  const errors: string[] = [];
  const caseNum = form.caseNumber as CaseNumber;

  if (!caseNum || !DOCUMENT_REQUIREMENTS[caseNum]) {
    errors.push('Veuillez sélectionner votre situation (cas)');
    return errors;
  }

  const rules = DOCUMENT_REQUIREMENTS[caseNum];

  if (rules.drivingLicense && !form.noLicense) {
    if (!form.licenseUrl) {
      errors.push('Veuillez téléverser le scan / photo de votre permis');
    }
  }

  if (rules.docCat2) {
    if (!form.doc48nUrl) {
      errors.push('Veuillez téléverser le scan de la lettre 48N');
    }
    if (!form.letterNumber?.trim()) {
      errors.push('Le numéro du recommandé 48N est obligatoire');
    }
    if (!form.letterCode?.trim()) {
      errors.push('Le code du recommandé 48N est obligatoire');
    }
  }

  if (rules.docCat3Cat4) {
    if (!form.judgementUrl) {
      errors.push('Veuillez téléverser le scan du jugement / ordonnance');
    }
    if (!form.judgementNumber?.trim()) {
      errors.push('Le numéro du jugement est obligatoire');
    }
    if (!form.dateOfJudgement) {
      errors.push('La date du jugement est obligatoire');
    }
  }

  return errors;
}
