"use client";

import { Printer } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";

import { REPORT_PRINT_ACTION_LABEL } from "../constants";

export function ReportPrintButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <AppButton
      type="button"
      variant="outline"
      onClick={handlePrint}
      className="report-print-hidden w-full sm:w-auto"
    >
      <Printer size={16} aria-hidden="true" />
      {REPORT_PRINT_ACTION_LABEL}
    </AppButton>
  );
}
