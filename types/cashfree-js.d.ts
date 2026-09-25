// Minimal types for the official Cashfree JS loader (the package ships none).
declare module "@cashfreepayments/cashfree-js" {
  export interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
    returnUrl?: string;
  }
  export interface CheckoutResult {
    error?: { message?: string; code?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  }
  export interface Cashfree {
    checkout(options: CheckoutOptions): Promise<CheckoutResult>;
  }
  export function load(options: { mode: "sandbox" | "production" }): Promise<Cashfree | null>;
}
