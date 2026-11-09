import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

export interface PermissionDeniedStateProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  className?: string;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({
  title = 'Acesso Restrito',
  message = 'Você não possui permissão para acessar este recurso ou módulo. Se acredita que isso seja um erro, entre em contato com a administração do seu condomínio.',
  onBack,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-3xl text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
        {message}
      </p>

      {onBack && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            Voltar ao Início
          </Button>
        </div>
      )}
    </div>
  );
};
