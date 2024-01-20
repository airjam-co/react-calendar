import { BookingResource } from "@airjam/types";

export interface BookingRequestResource {
  resource: BookingResource;
  startTimeUtc: Date;
  endTimeUtc: Date;
}
