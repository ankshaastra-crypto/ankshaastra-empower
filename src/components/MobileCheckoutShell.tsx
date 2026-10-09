import { useEffect, useRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileCheckoutShellProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: number;
  onBack: () => void;
  onContinue: () => void;
  submitting: boolean;
  price: string;
}

export default function MobileCheckoutShell({ children, open, onOpenChange, step, onBack, onContinue, submitting, price }: MobileCheckoutShellProps) {
  const mobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mobile && open) scrollRef.current?.scrollTo({ top: 0 });
  }, [mobile, open, step]);
  if (!mobile) return <>{children}</>;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="mobile-checkout-sheet fixed inset-x-0 bottom-0 z-50 flex h-[94dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-border bg-card text-foreground shadow-card-hover outline-none"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <header className="shrink-0 bg-card px-5 pb-4 pt-3">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} aria-label={step === 1 ? "Back to packages" : "Back to details"} className="shrink-0 rounded-full">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm text-muted-foreground">Step {step} of 2</p>
                <DialogPrimitive.Title className="font-body text-xl font-bold leading-tight">
                  {step === 1 ? "Your report details" : "Review & pay"}
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close order form" className="shrink-0 rounded-full bg-muted"><X className="h-5 w-5" /></Button>
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">Enter your details and review your selected report before payment.</DialogPrimitive.Description>
            <div className="mt-5 flex gap-2" aria-label={`Step ${step} of 2`}>
              {[1, 2].map((item) => <span key={item} className={cn("h-1 flex-1 rounded-full", item === step ? "bg-accent" : item < step ? "bg-foreground" : "bg-muted")} />)}
            </div>
          </header>
          <div ref={scrollRef} className="mobile-checkout-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6" data-checkout-scroll>
            {children}
          </div>
          <footer className="mobile-checkout-footer shrink-0 border-t border-border bg-card px-5 pt-4">
            <Button variant="hero" size="lg" className="w-full rounded-full shadow-none hover:scale-100" onClick={onContinue} disabled={submitting}>
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : step === 1 ? "Continue" : `Proceed to Pay ${price}`}
            </Button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}