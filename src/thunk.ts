import { CALENDAR_BOOK_ENDPOINT, CALENDAR_CONFIG_ENDPOINT, CalendarBookingAvailability, CalendarEvent, DEFAULT_HOST, GetEventsDuration, addDays, compareEventsByStartTime } from "@airjam/types";
import { BookingRequestInternal } from "./BookingRequestInternal";
import { BookingResponse } from "./BookingResponse";

export const fetchReservationTerms = async (
  componentId: string,
  queryStartTime: Date,
  queryEndTime?: Date | undefined,
  host?: string,
  authToken?: string,
  getDuration: GetEventsDuration = GetEventsDuration.WholeMonth
): Promise<CalendarBookingAvailability | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  const fetchStartTime =
    getDuration === GetEventsDuration.WholeMonth
      ? new Date(queryStartTime.getFullYear(), queryStartTime.getMonth(), 1)
      : new Date(queryStartTime);
  let fetchEndTime: Date = queryEndTime
    ? new Date(queryEndTime)
    : addDays(fetchStartTime, 1);
  if (getDuration === GetEventsDuration.WholeMonth) {
    // move to the last day of the given month
    fetchEndTime = new Date(
      fetchEndTime.getFullYear(),
      fetchEndTime.getMonth() + 1,
      0
    );
  }

  hostUrl +=
    CALENDAR_BOOK_ENDPOINT +
    componentId +
    '&startTimeUtc=' +
    fetchStartTime.toISOString() +
    '&endTimeUtc=' +
    fetchEndTime!.toISOString();

  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
      }),
    });
    if (json) {
      const response = await json.json();
      if (response) {
        // backfill start dates for compatibility
        if (response.resources) {
          for (let i = 0; i < response.resources.length; i++) {
            if (!response.resources[i].availableEvents) continue;
            for (
              let j = 0;
              j < response.resources[i].availableEvents.length;
              j++
            ) {
              if (!response.resources[i].availableEvents[j].startTimeUtc) {
                response.resources[i].availableEvents[j].startTimeUtc =
                  response.resources[i].availableEvents[j].startTimeUtc;
              }
              if (!response.resources[i].availableEvents[j].endTimeUtc) {
                response.resources[i].availableEvents[j].endTimeUtc =
                  response.resources[i].availableEvents[j].endTimeUtc;
              }
            }
          }
        }
        return response;
      }
    }
    return undefined;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export const bookReservation = async (
  componentId: string,
  request: BookingRequestInternal,
  host?: string,
  authToken?: string
) => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_BOOK_ENDPOINT + componentId;
  const requestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? 'Bearer ' + authToken : '',
    },
    body: JSON.stringify(request),
  };
  try {
    const json = await fetch(hostUrl, requestOptions);
    if (json) {
      const resp = await json.json();
      return resp as BookingResponse;
    }
    return undefined;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export const fetchCalendarView = async (
  componentId: string,
  queryStartTime: Date,
  queryEndTime?: Date | undefined,
  host?: string,
  authToken?: string,
  location?: string
): Promise<CalendarEvent[] | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  const queryStartDate = new Date(queryStartTime);
  hostUrl +=
    CALENDAR_CONFIG_ENDPOINT +
    componentId +
    '&startTimeUtc=' +
    queryStartDate.toISOString();
  if (queryEndTime) {
    const queryEndDate = new Date(queryEndTime);
    hostUrl += '&endTimeUtc=' + queryEndDate!.toISOString();
  } else {
    hostUrl += '&endTimeUtc=' + addDays(queryStartDate, 1).toISOString();
  }
  if (location) {
    hostUrl += '&location=' + encodeURIComponent(location);
  }
  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
      }),
    });
    if (json) {
      const resp = await json.json();
      if (resp && resp.events) {
        const newEvents: CalendarEvent[] = [];
        for (const e of resp.events) {
          // TODO: legacy backward compatibility code, remove when you can
          e.start = e.calculatedStartTimeUtc
            ? e.calculatedStartTimeUtc
            : e.startTimeUtc;
          e.end = e.calculatedRecurrenceEndTimeUtc
            ? e.calculatedRecurrenceEndTimeUtc
            : e.endTimeUtc;
          e.isAllDay = e.isAllDay;
          newEvents.push(e);
        }
        newEvents.sort(compareEventsByStartTime); // sort events by start time
        return newEvents;
      }
    }
    return undefined;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};
