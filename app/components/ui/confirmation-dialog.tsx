'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

const variantConfig = {
  default: {
    icon: HelpCircle,
    iconColor: 'text-blue-500',
    confirmVariant: 'default' as const,
  },
  destructive: {
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    confirmVariant: 'destructive' as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    confirmVariant: 'default' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    confirmVariant: 'default' as const,
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    confirmVariant: 'default' as const,
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 sm:gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={config.confirmVariant} onClick={handleConfirm}>
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook para usar el diálogo de confirmación
export function useConfirmationDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirm = React.useCallback((options: Omit<typeof dialogState, 'open'>) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        ...options,
        open: true,
        onConfirm: () => {
          options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          options.onCancel?.();
          resolve(false);
        },
      });
    });
  }, []);

  const ConfirmationDialogComponent = React.useCallback(() => (
    <ConfirmationDialog
      {...dialogState}
      onOpenChange={(open) => {
        if (!open) {
          setDialogState(prev => ({ ...prev, open: false }));
        }
      }}
    />
  ), [dialogState]);

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}