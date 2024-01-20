export interface BookingRequestInternal {
  id: string; // calendar id
  startTimeUtc: string;
  endTimeUtc: string;
  resourceId: string;
  name: string;
  email: string;
  comment: string;
}
