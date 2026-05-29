import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/**
 * Promise-based confirmation dialog. Usage:
 *   const { confirm, dialog } = useConfirm();
 *   // render {dialog} once in the tree
 *   if (!(await confirm({ title: "Delete?", destructive: true }))) return;
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirm = useCallback((options: ConfirmOptions = {}) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = undefined;
  }, []);

  const dialog = (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) settle(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{opts.title ?? "Are you sure?"}</AlertDialogTitle>
          {opts.description && <AlertDialogDescription>{opts.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>{opts.cancelText ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            className={opts.destructive ? "bg-red-600 hover:bg-red-700 focus:ring-red-600" : undefined}
          >
            {opts.confirmText ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
