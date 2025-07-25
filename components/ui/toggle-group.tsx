"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

type ColorConfig = {
  selected: string
  unselected: string
}

type ToggleGroupContextType = VariantProps<typeof toggleVariants> & {
  colorConfigs?: Record<string, ColorConfig>
  selectedValue?: string
}

const ToggleGroupContext = React.createContext<ToggleGroupContextType>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants> & {
      colorConfigs?: Record<string, ColorConfig>
    }
>(({ className, variant, size, children, colorConfigs, ...props }, ref) => {
  const selectedValue = typeof props.value === 'string' ? props.value : undefined
  
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, colorConfigs, selectedValue }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, value, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  const isSelected = context.selectedValue === value
  const colorConfig = context.colorConfigs?.[value as string]
  
  const colorClasses = colorConfig 
    ? isSelected 
      ? colorConfig.selected
      : colorConfig.unselected
    : ''

  // Override default toggle styles when color config is provided
  const baseClasses = colorConfig 
    ? "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border"
    : toggleVariants({
        variant: context.variant || variant,
        size: context.size || size,
      })

  const sizeClasses = context.size === 'sm' ? 'h-9 px-2.5' : context.size === 'lg' ? 'h-11 px-5' : 'h-10 px-3'

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        baseClasses,
        colorConfig && sizeClasses,
        colorClasses,
        className
      )}
      value={value}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
