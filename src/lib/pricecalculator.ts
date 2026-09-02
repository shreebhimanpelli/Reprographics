import type {
  BindingType,
  DuplexMode,
  LaminationType,
  PaperSize,
  PriceBreakdown,
  PricingConfig,
  PrintType,
  UserRole,
} from "@/types";

export function countSelectedPages(
  selectedPageRange: string,
  pageCount: number,
): number {
  if (!selectedPageRange || selectedPageRange.trim().toLowerCase() === "all") {
    return pageCount;
  }

  const parts = selectedPageRange.trim();
  const pages = new Set<number>();

  for (const raw of parts.split(",")) {
    const token = raw.trim();
    if (token.includes("-")) {
      const [startRaw, endRaw] = token.split("-");
      const start = parseInt(startRaw, 10);
      const end = parseInt(endRaw, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const lo = Math.max(1, Math.min(start, end));
        const hi = Math.min(pageCount, Math.max(start, end));
        for (let page = lo; page <= hi; page++) pages.add(page);
      }
    } else {
      const page = parseInt(token, 10);
      if (!isNaN(page) && page >= 1 && page <= pageCount) pages.add(page);
    }
  }

  return pages.size > 0 ? pages.size : pageCount;
}

export function calculatePrice(
  effectivePages: number,
  copyCount: number,
  printType: PrintType,
  role: UserRole,
  pricing: PricingConfig,
  duplexMode: DuplexMode = "SINGLE",
  paperSize: PaperSize = "A4",
  adminBillingMode?: "EXEMPT" | "CHARGEABLE",
  bindingType: BindingType = "NONE",
  laminationType: LaminationType = "NONE",
): PriceBreakdown {
  const isExempt =
    adminBillingMode === "CHARGEABLE"
      ? false
      : adminBillingMode === "EXEMPT"
      ? true
      : (role === "FACULTY" && pricing.facultyExemption) ||
        (role === "STAFF" && pricing.staffExemption) ||
        role === "SUPER_ADMIN";

  const totalImpressions = effectivePages * copyCount;
  const paperSheetsConsumed =
    (duplexMode === "DUPLEX" ? Math.ceil(effectivePages / 2) : effectivePages) *
    copyCount;

  if (isExempt) {
    return {
      ratePerPage: 0,
      totalCost: 0,
      printCost: 0,
      bindingCost: 0,
      laminationCost: 0,
      isExempt: true,
      totalImpressions,
      paperSheetsConsumed,
    };
  }

  let ratePerPage =
    paperSize === "A3"
      ? printType === "COLOR"
        ? pricing.a3ColorPricePerPage
        : pricing.a3BwPricePerPage
      : printType === "COLOR"
        ? pricing.colorPricePerPage
        : pricing.bwPricePerPage;

  if (duplexMode === "DUPLEX") ratePerPage *= pricing.duplexMultiplier;

  const printCost = totalImpressions * ratePerPage;

  // Binding: Flat fee per copy
  let bindingUnitCost = 0;
  if (bindingType === "SPIRAL" || bindingType === "SOFT_COVER") {
    bindingUnitCost = pricing.bindingPrice ?? 30;
  } else if (bindingType === "HARD_COVER") {
    bindingUnitCost = Math.round((pricing.bindingPrice ?? 30) * 1.5);
  }
  const bindingCost = bindingUnitCost * copyCount;

  // Lamination: Per page per copy
  let laminationCost = 0;
  const laminationRate = pricing.laminationPricePerPage ?? 15;
  if (laminationType === "ALL_PAGES") {
    laminationCost = laminationRate * effectivePages * copyCount;
  } else if (laminationType === "COVER_ONLY") {
    laminationCost = laminationRate * Math.min(2, effectivePages) * copyCount;
  }

  const totalCost =
    Math.round((printCost + bindingCost + laminationCost + Number.EPSILON) * 100) / 100;

  return {
    ratePerPage,
    totalCost,
    printCost: Math.round((printCost + Number.EPSILON) * 100) / 100,
    bindingCost: Math.round((bindingCost + Number.EPSILON) * 100) / 100,
    laminationCost: Math.round((laminationCost + Number.EPSILON) * 100) / 100,
    isExempt: false,
    totalImpressions,
    paperSheetsConsumed,
  };
}

export function paperSheetsForJob(job: {
  paperSheetsConsumed?: number;
  duplexMode: DuplexMode;
  effectivePages: number;
  copyCount: number;
}): number {
  if (job.paperSheetsConsumed) return job.paperSheetsConsumed;
  return job.duplexMode === "DUPLEX"
    ? Math.ceil(job.effectivePages / 2) * job.copyCount
    : job.effectivePages * job.copyCount;
}
