export type UserActivityStatus = "success" | "failed" | "info";

export type UserActivityEvent = {
  action: string;
  status: UserActivityStatus;
  summary: string;
  metadata?: Record<string, unknown>;
};

export const reportUserActivity = async (event: UserActivityEvent) => {
  void event;
  return;
};
