"use client"

// Adapted from Skiper UI's skiper101 ("Custom tooltip") for base-ui/react
// instead of Radix — this project's primitives are base-ui throughout, so a
// second overlay library just for tooltips would duplicate/conflict with it.
// https://skiper-ui.com — free component, attribution per its license.
import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 200,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 8,
  side = "top",
  children,
  ...props
}: TooltipPrimitive.Positioner.Props & TooltipPrimitive.Popup.Props) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={sideOffset} side={side} {...props}>
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 w-fit origin-(--transform-origin) rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground text-balance outline-1 outline-border transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
            className,
          )}
        >
          {children}
          <TooltipPrimitive.Arrow className="fill-popover">
            <ArrowSvg />
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

const ArrowSvg = (props: React.ComponentProps<"svg">) => (
  <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M0 0L6 6L12 0H0Z" fill="currentColor" />
  </svg>
)
