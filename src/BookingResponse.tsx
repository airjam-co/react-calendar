import { PaymentIntentDetail } from "@airjam/types";

export interface BookingResponse {
  success: boolean;
  id: string;
  moderationKey: string;
  paymentIntent: PaymentIntentDetail;
}
