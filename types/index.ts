export type UserRole = "USER" | "MODERATOR" | "ADMIN";

export type PaymentState = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface UserAccount {
  id: string;
  username: string;
  balance: number;
  role: UserRole;
  isFrozen: boolean;
  totalDeposits: number;
  totalWithdrawals: number;
}

export interface SystemConfig {
  globalHouseEdge: number;
  maintenanceMode: boolean;
}

export interface BetLog {
  id: string;
  userId: string;
  gameId: string;
  wager: number;
  multiplier: number;
  payout: number;
  status: "WIN" | "LOSS" | "VOID";
  timestamp: Date;
}
