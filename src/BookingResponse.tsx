import { EventReservationStatus, PaymentIntentDetail } from "@airjam/types";

export interface BookingResponse {
  success: boolean;
  status: EventReservationStatus;
  id: string;
  moderationKey: string;
  paymentIntent: PaymentIntentDetail;
}
