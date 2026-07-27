import type { ProgramData } from "./types";

// Static imports (not fs reads) so this bundles correctly in serverless
// functions and the client alike — no filesystem access needed at runtime.
import csData from "@/data/cs_prerequisites.json";
import ceData from "@/data/ce_prerequisites.json";
import eeData from "@/data/ee_prerequisites.json";
import bbaAccountingData from "@/data/bba_accounting_prerequisites.json";
import bbaMisData from "@/data/bba_mis_prerequisites.json";
import bbaEconomicsData from "@/data/bba_economics_prerequisites.json";
import bbaFinanceData from "@/data/bba_finance_prerequisites.json";
import bbaManagementData from "@/data/bba_management_prerequisites.json";
import bbaMarketingData from "@/data/bba_marketing_prerequisites.json";
import otherProgramsData from "@/data/other_programs.json";

export const PROGRAM_DATA_MAP: Record<string, ProgramData> = {
  "cs_prerequisites.json": csData as ProgramData,
  "ce_prerequisites.json": ceData as ProgramData,
  "ee_prerequisites.json": eeData as ProgramData,
  "bba_accounting_prerequisites.json": bbaAccountingData as ProgramData,
  "bba_mis_prerequisites.json": bbaMisData as ProgramData,
  "bba_economics_prerequisites.json": bbaEconomicsData as ProgramData,
  "bba_finance_prerequisites.json": bbaFinanceData as ProgramData,
  "bba_management_prerequisites.json": bbaManagementData as ProgramData,
  "bba_marketing_prerequisites.json": bbaMarketingData as ProgramData,
  "other_programs.json": otherProgramsData as ProgramData,
};
