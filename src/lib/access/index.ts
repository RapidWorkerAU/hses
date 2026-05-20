export type BillingAccessStatus = "active" | "trialing" | "payment_failed" | "expired" | "cancelled" | "none";

export type BillingAccessState = {
  userId: string | null;
  canEditMaps: boolean;
  currentAccessStatus: BillingAccessStatus;
  currentAccessType: string | null;
  currentAccessPeriodId: string | null;
  readOnlyReason: string | null;
  orgManagedAccess?: boolean;
};

export const fetchAccessState = async (accessToken: string): Promise<BillingAccessState> => {
  void accessToken;
  return {
    userId: null,
    canEditMaps: true,
    currentAccessStatus: "active",
    currentAccessType: "hses_portal",
    currentAccessPeriodId: null,
    readOnlyReason: null,
    orgManagedAccess: false,
  };
};

export const accessRequiresSelection = (accessState: BillingAccessState | null | undefined) => {
  void accessState;
  return false;
};

export const accessBlocksInvestigationEntry = (accessState: BillingAccessState | null | undefined) => {
  void accessState;
  return false;
};
