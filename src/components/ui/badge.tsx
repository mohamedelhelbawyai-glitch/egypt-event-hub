import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-[#185A7D]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-[#FEE2E2] bg-[#FEF2F2] text-[#991B1B]",
        outline:
          "border-border text-foreground bg-transparent",
        success:
          "border-[#D1FAE5] bg-[#ECFDF5] text-[#065F46]",
        warning:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
        info:
          "border-[#DBEAFE] bg-[#EFF6FF] text-[#1E40AF]",
        navy:
          "border-transparent bg-[#1A3C5E] text-[#BFE1F0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
