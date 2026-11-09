import React, { useState, useRef, forwardRef, useId } from 'react';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';

export interface FileInputProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File | null) => void;
  disabled?: boolean;
  containerClassName?: string;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      label,
      description,
      error,
      required = false,
      accept,
      maxSizeMB = 10,
      onFileSelect,
      disabled = false,
      containerClassName = '',
    },
    ref
  ) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const generatedId = useId();

    const handleFile = (file: File | null) => {
      if (!file) {
        setSelectedFile(null);
        setValidationError(null);
        onFileSelect?.(null);
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setValidationError(`Arquivo excede o limite máximo de ${maxSizeMB}MB.`);
        return;
      }

      setValidationError(null);
      setSelectedFile(file);
      onFileSelect?.(file);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    };

    const clearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleFile(null);
      if (inputRef.current) inputRef.current.value = '';
    };

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            relative w-full p-4 border-2 border-dashed rounded-2xl transition-all duration-150 text-center cursor-pointer select-none
            ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-800'
                : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            id={generatedId}
            type="file"
            accept={accept}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="sr-only"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Remover arquivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Arraste e solte o arquivo aqui ou <span className="text-blue-600 dark:text-blue-400 underline">procure no dispositivo</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {accept ? `Formatos aceitos: ${accept}` : 'Documentos, PDFs ou Imagens'} (Máx: {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>

        {description && !error && !validationError && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}

        {(error || validationError) && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error || validationError}</span>
          </p>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
