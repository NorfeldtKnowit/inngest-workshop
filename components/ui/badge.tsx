import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center px-3 py-1 text-xs font-bold uppercase w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-150 overflow-hidden border-2",
  {
    variants: {
      variant: {
        default:
          "bg-amber-300 text-amber-900 border-amber-800 shadow-[2px_2px_0px_rgba(120,53,15,0.8)] hover:shadow-[1px_1px_0px_rgba(120,53,15,0.8)] hover:translate-x-[1px] hover:translate-y-[1px]",
        secondary:
          "bg-green-300 text-green-900 border-green-800 shadow-[2px_2px_0px_rgba(22,101,52,0.8)] hover:shadow-[1px_1px_0px_rgba(22,101,52,0.8)] hover:translate-x-[1px] hover:translate-y-[1px]",
        destructive:
          "bg-red-300 text-red-900 border-red-800 shadow-[2px_2px_0px_rgba(153,27,27,0.8)] hover:shadow-[1px_1px_0px_rgba(153,27,27,0.8)] hover:translate-x-[1px] hover:translate-y-[1px]",
        outline:
          "bg-gray-100 text-gray-900 border-gray-800 shadow-[2px_2px_0px_rgba(31,41,55,0.8)] hover:shadow-[1px_1px_0px_rgba(31,41,55,0.8)] hover:translate-x-[1px] hover:translate-y-[1px]",
        orange:
          "bg-orange-300 text-orange-900 border-orange-800 shadow-[2px_2px_0px_rgba(154,52,18,0.8)] hover:shadow-[1px_1px_0px_rgba(154,52,18,0.8)] hover:translate-x-[1px] hover:translate-y-[1px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
