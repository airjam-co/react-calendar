import { AirJamFilter, CALENDAR_BOOK_ENDPOINT, CALENDAR_CONFIG_ENDPOINT, CALENDAR_RESOURCE_MY_RESERVATIONS_ENDPOINT, CALENDAR_RESOURCE_MY_RESERVATION_REQUESTS_ENDPOINT, CALENDAR_RESOURCE_MY_RESOURCES_ENDPOINT, CALENDAR_RESOURCE_MY_RESOURCE_ENDPOINT, CALENDAR_RESOURCE_RESERVATION_ENDPOINT, CALENDAR_RESOURCE_SEARCH_ENDPOINT, CALENDAR_TRANSLATIONS_ENDPOINT, CalendarBookOn, CalendarBookingAvailability, CalendarBookingRequest, CalendarEvent, CalendarResource, CalendarResourceFieldProperty, ComponentTranslation, DEFAULT_HOST, EventReservation, EventReservationPaymentIntentDetail, EventReservationStatus, GetEventsDuration, PrivateCalendarResource, addDays, compareEventsByStartTime } from "@airjam/types";
import { BookingResponse } from "./BookingResponse";

export const fetchReservationTerms = async (
  componentId: string,
  queryStartTime: Date,
  queryEndTime?: Date | undefined,
  host?: string,
  authToken?: string,
  resourceId?: string,
  getDuration: GetEventsDuration = GetEventsDuration.WholeMonth
): Promise<CalendarBookingAvailability | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  const fetchStartTime =
    getDuration === GetEventsDuration.WholeMonth
      ? addDays(new Date(queryStartTime), -31)
      : new Date(queryStartTime);
  let fetchEndTime: Date = queryEndTime
    ? new Date(queryEndTime)
    : addDays(fetchStartTime, 1);
  if (getDuration === GetEventsDuration.WholeMonth) {
    // add 31 days to the fetch start time
    fetchEndTime = addDays(queryStartTime, 31);
  }

  hostUrl +=
    CALENDAR_BOOK_ENDPOINT +
    componentId +
    '&startTimeUtc=' +
    fetchStartTime.toISOString() +
    '&endTimeUtc=' +
    fetchEndTime!.toISOString();
  if (resourceId) hostUrl += '&resourceId=' + resourceId;

  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'Access-Control-Allow-Origin': '*',
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

export const getReservationPaymentDetail = async (
  componentId: string,
  request: CalendarBookingRequest,
  host?: string,
  authToken?: string
) : Promise<EventReservationPaymentIntentDetail | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += "/s/calendar/payment_details";
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Authorization': authToken ? 'Bearer ' + authToken : '',
    },
    body: JSON.stringify(request),
  }
  try {
    const json = await fetch(hostUrl, requestOptions);
    if (json) {
      const resp = await json.json();
      return resp as EventReservationPaymentIntentDetail;
    }
    return undefined;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export const bookReservation = async (
  componentId: string,
  request: CalendarBookingRequest,
  host?: string,
  authToken?: string
) : Promise<BookingResponse | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_BOOK_ENDPOINT + componentId;
  const requestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? 'Bearer ' + authToken : '',
      'Access-Control-Allow-Origin': '*',
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

export const cancelReservation = async (
  reservationId: string,
  host?: string,
  authToken?: string,
  moderationKey?: string,
) : Promise<BookingResponse> => {
  // need to provide either the moderation key or auth token
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_BOOK_ENDPOINT;
  const requestOptions = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? 'Bearer ' + authToken : '',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      id: reservationId,
      key: moderationKey
    }),
  };
  try {
    const json = await fetch(hostUrl, requestOptions);
    if (json) {
      const resp = await json.json();
      return resp as BookingResponse;
    }
    return { success: false } as BookingResponse;
  } catch (error) {
    console.log(error);
    return { success: false } as BookingResponse;
  }
};

export const moderateReservation = async (
  componentId: string,
  reservationId: string,
  decision: EventReservationStatus,
  host?: string,
  authToken?: string
): Promise<boolean> => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_RESOURCE_RESERVATION_ENDPOINT + "?id=" + componentId;
  const requestOptions = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? 'Bearer ' + authToken : '',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      id: reservationId,
      decision: decision
    }),
  };
  try {
    const json = await fetch(hostUrl, requestOptions);
    if (json) {
      const resp = await json.json();
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const searchResources = async (
  componentId: string,
  host?: string,
  latitude?: number,
  longitude?: number,
  authToken?: string,
  page?: number,
  resultsPerPage?: number,
  priceMin?: number,
  priceMax?: number,
  minDistance?: number,
  maxDistance?: number,
  northEast?: string,
  southWest?: string,
  customFilters?: AirJamFilter,
): Promise<CalendarResource[] | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_RESOURCE_SEARCH_ENDPOINT + componentId
  if (latitude) hostUrl += '&lat=' + latitude
  if (longitude) hostUrl += '&lng=' + longitude
  if (page) hostUrl += '&page=' + page
  if (resultsPerPage) hostUrl += '&resultsPerPage=' + resultsPerPage
  if (priceMin) hostUrl += '&priceMin=' + priceMin
  if (priceMax) hostUrl += '&priceMax=' + priceMax
  if (minDistance) hostUrl += '&minDistance=' + minDistance
  if (maxDistance) hostUrl += '&maxDistance=' + maxDistance
  if (northEast) hostUrl += '&northEast=' + northEast
  if (southWest) hostUrl += '&southWest=' + southWest
  if (customFilters) {
    console.log(JSON.stringify(customFilters))
    hostUrl += '&filter=' + JSON.stringify(customFilters)
  }
  console.log(hostUrl);
  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
      }),
    });
    if (json) {
      const resp = await json.json();
      if (resp && resp.resources) {
        return resp.resources;
      }
    }
    return undefined
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export const fetchMyReservations = async (
  componentId: string,
  host?: string,
  authToken?: string,
  queryStartTime?: Date,
  queryEndTime?: Date | undefined,
  page?: number,
  resultsPerPage?: number,
  reservationStatus?: EventReservationStatus,
): Promise<FetchReservationsResult | undefined> => {
  const queryStartDate = queryStartTime ? new Date(queryStartTime) : new Date();
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_RESOURCE_MY_RESERVATIONS_ENDPOINT + "?id=" + componentId + "&startTimeUtc=" + queryStartDate.toISOString();
  if (page) {
    hostUrl += '&page=' + page
  }
  if (resultsPerPage) {
    hostUrl += '&resultsPerPage=' + resultsPerPage
  }
  if (queryEndTime) {
    const queryEndDate = new Date(queryEndTime);
    hostUrl += '&endTimeUtc=' + queryEndDate!.toISOString();
  } else {
    hostUrl += '&endTimeUtc=' + addDays(queryStartDate, 1).toISOString();
  }
  if (reservationStatus) hostUrl += '&reservationStatus=' + reservationStatus;
  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'Access-Control-Allow-Origin': '*',
      }),
    });
    if (json) {
      const resp = await json.json();
      if (resp) {
        return resp as FetchReservationsResult;
      }
    }
    return undefined
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export interface FetchReservationsResult {
  reservations: EventReservation[];
  translations: any;
}

// returns pending requests from current time by default
export const fetchMyReservationRequests = async (
  componentId: string,
  host?: string,
  authToken?: string,
  queryStartTime?: Date,
  queryEndTime?: Date | undefined,
  page?: number,
  resultsPerPage?: number,
  reservationStatus?: EventReservationStatus,
  resourceId?: string,
): Promise<FetchReservationRequestsResult | undefined> => {
  const queryStartDate = queryStartTime ? new Date(queryStartTime) : new Date();
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_RESOURCE_MY_RESERVATION_REQUESTS_ENDPOINT + "?id=" + componentId + "&startTimeUtc=" + queryStartDate.toISOString();
  if (page) {
    hostUrl += '&page=' + page
  }
  if (resultsPerPage) {
    hostUrl += '&resultsPerPage=' + resultsPerPage
  }
  if (queryEndTime) {
    const queryEndDate = new Date(queryEndTime);
    hostUrl += '&endTimeUtc=' + queryEndDate!.toISOString();
  } else {
    hostUrl += '&endTimeUtc=' + addDays(queryStartDate, 1).toISOString();
  }
  if (reservationStatus) hostUrl += '&reservationStatus=' + reservationStatus;
  if (resourceId) hostUrl += '&resourceId=' + resourceId;
  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'Access-Control-Allow-Origin': '*',
      }),
    });
    if (json) {
      const resp = await json.json();
      if (resp) {
        return resp as FetchReservationRequestsResult;
      }
    }
    return undefined
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export interface FetchReservationRequestsResult {
  reservations: EventReservation[];
  translations: any;
}


export const fetchMyResources = async (
  componentId: string,
  host?: string,
  authToken?: string,
  page?: number,
  resultsPerPage?: number,
): Promise<FetchResourcesResult | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_RESOURCE_MY_RESOURCES_ENDPOINT + "?id=" + componentId
  if (page) {
    hostUrl += '&page=' + page
  }
  if (resultsPerPage) {
    hostUrl += '&resultsPerPage=' + resultsPerPage
  }
  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'Access-Control-Allow-Origin': '*',
      }),
    });
    if (json) {
      const resp = await json.json();
      if (resp && resp) {
        return {
          resources: resp.resources,
          resourceFieldProperties: resp.resourceFieldProperties
        } as FetchResourcesResult;
      }
    }
    return undefined
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export interface FetchResourcesResult {
  resources: PrivateCalendarResource[];
  resourceFieldProperties: {[fieldName: string]: CalendarResourceFieldProperty};
}

export interface ResourceDetailResult {
  resource: PrivateCalendarResource;
  resourceFieldProperties: {[fieldName: string]: CalendarResourceFieldProperty};
}

export const fetchResourceDetail = async (
  componentId: string,
  resourceId: string,
  host?: string,
  authToken?: string,
): Promise<ResourceDetailResult | undefined> => {
  let hostUrl = host || DEFAULT_HOST;
  hostUrl += CALENDAR_RESOURCE_MY_RESOURCE_ENDPOINT + "/" + componentId + "/" + resourceId
  try {
    const json = await fetch(hostUrl, {
      headers: new Headers({
        Authorization: authToken ? 'Bearer ' + authToken : '',
        'Access-Control-Allow-Origin': '*',
      }),
    });
    if (json) {
      const resp = await json.json();
      if (resp) {
        return resp as ResourceDetailResult;
      }
    }
    return undefined
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
        'Access-Control-Allow-Origin': '*',
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

export const getTranslations = async (id: string, host?: string, locale?: string): Promise<ComponentTranslation | undefined> => {
    let hostUrl = host || DEFAULT_HOST;
    hostUrl += CALENDAR_TRANSLATIONS_ENDPOINT + "?id=" + id;
    if (locale) hostUrl += "&locale=" + locale;
    try {
      const json = await fetch(hostUrl, {
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
        }),
      });
      if (json && json) {
        const response = await json.json();
        if (response && response.translations) return response.translations as ComponentTranslation;
      }
      return undefined;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };
