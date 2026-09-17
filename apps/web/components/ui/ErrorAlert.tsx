'use client';

type Props = {
  message?: string;
  errors?: string[];
  onClose?: () => void;
};

/**
 * Reusable error alert component.
 */
export default function ErrorAlert({ message, errors, onClose }: Props) {
  if (!message && (!errors || errors.length === 0)) return null;

  return (
    <div
      role="alert"
      className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {message && <p className="font-medium">{message}</p>}
          {errors && errors.length > 0 && (
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-red-700">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-red-400 hover:text-red-600"
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
