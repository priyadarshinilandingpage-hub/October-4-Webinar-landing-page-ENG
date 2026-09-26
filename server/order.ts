import { notesOf, type RazorpayOrder } from "./razorpay";

/** A verified, paid order in the shape the follow-up steps use. Customer details come from the order's notes,
 *  which only our server writes (at order creation, from the validated form). */
export interface PaidOrder {
  id: string;
  amountPaise: number;
  currency: string;
  customer: { name?: string; email?: string; phone?: string };
  notes: Record<string, string>;
}

export function toPaidOrder(order: RazorpayOrder): PaidOrder {
  const notes = notesOf(order);
  return {
    id: order.id,
    amountPaise: order.amount_paid,
    currency: order.currency,
    customer: { name: notes.name || undefined, email: notes.email || undefined, phone: notes.phone || undefined },
    notes,
  };
}
