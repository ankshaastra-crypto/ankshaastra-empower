import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        caption_dropdowns: "flex gap-2 items-center",
        vhidden: "sr-only",
        dropdown_month:
          "relative inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-sm font-medium shadow-sm hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-ring transition-colors [&>select]:appearance-none [&>select]:bg-transparent [&>select]:border-0 [&>select]:pr-5 [&>select]:pl-1 [&>select]:py-0 [&>select]:text-sm [&>select]:font-medium [&>select]:cursor-pointer [&>select]:focus:outline-none",
        dropdown_year:
          "relative inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-sm font-medium shadow-sm hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-ring transition-colors [&>select]:appearance-none [&>select]:bg-transparent [&>select]:border-0 [&>select]:pr-5 [&>select]:pl-1 [&>select]:py-0 [&>select]:text-sm [&>select]:font-medium [&>select]:cursor-pointer [&>select]:focus:outline-none",
        dropdown: "cursor-pointer",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-secondary/10 transition-all duration-200",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-10 font-medium text-[0.75rem] uppercase tracking-wider",
        row: "flex w-full mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-secondary/50 [&:has([aria-selected])]:bg-secondary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-secondary/15 hover:text-secondary-foreground transition-all duration-200 rounded-lg",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground shadow-sm",
        day_today:
          "bg-accent/15 text-accent-foreground font-semibold ring-1 ring-accent/30",
        day_outside:
          "day-outside text-muted-foreground opacity-40 aria-selected:bg-secondary/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle:
          "aria-selected:bg-secondary aria-selected:text-secondary-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
