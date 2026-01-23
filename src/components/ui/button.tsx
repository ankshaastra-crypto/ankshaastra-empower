import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Republic Day Theme Variants
        saffron: "bg-secondary text-secondary-foreground font-semibold hover:scale-105 shadow-saffron hover:shadow-[0_0_40px_hsl(24_100%_50%_/_0.4)]",
        "saffron-outline": "border-2 border-secondary text-secondary font-semibold hover:bg-secondary hover:text-secondary-foreground hover:scale-105",
        green: "bg-accent text-accent-foreground font-semibold hover:scale-105 shadow-green hover:shadow-[0_0_40px_hsl(145_63%_32%_/_0.4)]",
        navy: "bg-primary text-primary-foreground font-semibold hover:scale-105 shadow-navy",
        tricolor: "bg-gradient-to-r from-secondary via-primary to-accent text-white font-bold hover:scale-105 shadow-[0_0_30px_hsl(24_100%_50%_/_0.3)]",
        hero: "bg-gradient-to-r from-secondary to-accent text-white font-bold text-lg hover:scale-105 shadow-[0_0_30px_hsl(24_100%_50%_/_0.4)] hover:shadow-[0_0_50px_hsl(24_100%_50%_/_0.6)]",
        "hero-small": "bg-gradient-to-r from-secondary to-accent text-white font-semibold hover:scale-105 shadow-saffron",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-14 rounded-xl px-10 text-base",
        xl: "h-16 rounded-2xl px-12 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };