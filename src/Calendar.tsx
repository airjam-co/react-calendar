import React, { useEffect, useState } from 'react';
import { Calendar as ReactCalendar } from 'react-calendar';

import 'react-calendar/dist/Calendar.css';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import 'react-toastify/dist/ReactToastify.css';

import { Value } from 'react-calendar/dist/cjs/shared/types';

import Dropdown from 'react-bootstrap/Dropdown';
import { CalendarViewType as ViewType, CalendarEvent, CalendarBookingAvailability, addDays, GetEventsDuration, CalendarResource, Point, PrivateCalendarResource, CalendarResourceFieldProperty, EventReservation, EventReservationStatus, CALENDAR_RESOURCE_MY_RESOURCE_ENDPOINT, ComponentTranslation, Translation, getTranslation, CssTheme, CalendarBookingUnit, BookingResource, CalendarEventReservableUntilType, TimeUnit } from '@airjam/types';
import { Props } from './Props';
import { BookingResultPage } from './BookingResultPage';
import { BookingRequestResource } from './BookingRequestResource';
import { ToastContainer, toast } from 'react-toastify';
import { FetchReservationRequestsResult, FetchReservationsResult, bookReservation, fetchCalendarView, fetchMyReservationRequests, fetchMyReservations, fetchMyResources, fetchReservationTerms, fetchResourceDetail, getTranslations, cancelReservation, moderateReservation, searchResources } from './thunk';
import { timezoneData } from './timezone_data';
import { ReservationSuccessModal } from './ReservationSuccessModal';
import { ReservationModalWrapper } from './ReservationModalWrapper';
import { EventDetailList } from './EventDetailList';
import { AvailabilitiesForADay } from './AvailabilitiesForADay';
import { DayCalendarGroupedByLocation } from './DayCalendarGroupedByLocation';
import { EventListGroupedByDay } from './EventListGroupedByDay';
import { MapResourceList } from './MapResourceList';
import { Button } from 'react-bootstrap';
import { convertTimezoneOfDay, getPreferredTranslation } from './utilities';
import { ActionType } from './ActionType';

export { CalendarViewType as ViewType } from '@airjam/types';

const timezones: string[] = []
const BootstrapTheme = React.lazy(() => import('./themes/BootstrapTheme'));

export const Calendar = ({
  id,
  resourceId,
  authToken,
  host,
  cssTheme,
  onAction,
  renderEventFunc,
  renderResourceFunc,
  renderEventReservationFunc,
  renderMyReservationFunc,
  myReservationsHead,
  viewAs,
  showDate,
  showEndDate,
  locale,
  location,
  latitude,
  longitude,
  page,
  customFilters,
  priceMin,
  priceMax,
  maxDistance,
  minDistance,
  paginationStyle,
  resultsPerPage,
  reservationStatusFilter,
  descriptionLength,
  onResourceSelected,
  onCalendarMonthChanged,
  onBookingStartTimeChanged,
  onBookingEndTimeChanged,
  googleMapsApiKey,
  bookingDefaultEmail,
  bookingDefaultName,
  defaultMapZoom,
  mapMarkerImageUrl,
  mapMarkerImageMouseOverUrl,
  mapMarkerImageWidth,
  mapMarkerImageHeight,
  mapMarkerLabelFunc,
  paymentProcessorPublicKey,
  renderMapMarkerInfoWindowFunc,
  renderBookingResourcesSelectionFunc,
  renderResourceForSingularBookingFunc,
}: Props) => {
  const [startTime, setStartTime] = useState<Date>(
    new Date(new Date().setHours(0, 0, 0, 0))
  )
  const [events, setEvents] = React.useState<CalendarEvent[] | undefined>(undefined)
  const [isMounted, setIsMounted] = React.useState<Boolean>(false)
  const [availability, setAvailability] = React.useState<CalendarBookingAvailability | undefined>(undefined)
  const [bookingDialog, setBookingDialog] = React.useState<BookingRequestResource | undefined>(undefined)
  const [bookingResult, setBookingResult] = React.useState<BookingResultPage | undefined>(undefined)
  const [timezone, setTimezone] = React.useState<String>("")
  const [resourceSearchResult, setResourceSearchResult] = React.useState<CalendarResource[] | undefined>(undefined)
  const [myResources, setMyResources] = React.useState<PrivateCalendarResource[]>([])
  const [myReservations, setMyReservations] = React.useState<FetchReservationsResult | undefined>(undefined)
  const [myReservationRequests, setMyReservationRequests] = React.useState<FetchReservationRequestsResult | undefined>(undefined)
  const [resource, setResource] = React.useState<PrivateCalendarResource | undefined>(undefined)
  const [resourceIdSelected, setResourceIdSelected] = React.useState<string>("")
  const [resourceProperty, setResourceProperty] = React.useState<{[fieldName: string]: CalendarResourceFieldProperty}>({})
  const [selectedPage, setSelectedPage] = React.useState<number | undefined>(page);
  const [componentTranslations, setComponentTranslations] = React.useState<ComponentTranslation | undefined>(undefined)
  const [preferredTranslation, setPreferredTranslation] = React.useState<Translation>({} as Translation)
  const [dailyBookStart, setDailyBookStart] = React.useState<Date | undefined>()
  const [dailyBookEnd, setDailyBookEnd] = React.useState<Date | undefined>()
  const [, forceUpdate] = useState({});
  const mapBoundNorthEast = React.useRef<Point | undefined>(undefined);
  const mapBoundSouthWest = React.useRef<Point | undefined>(undefined);

  const startDate = showDate || dailyBookStart || undefined

  const onChange = (newDate: Value) => {
    if (newDate) {
      const newStartTime: Date = new Date(newDate.toString())
      setStartTime(newStartTime)
      if (onBookingStartTimeChanged) onBookingStartTimeChanged(newStartTime);
      if (isMounted) {
        if (viewAs === ViewType.CalendarBook || viewAs === ViewType.CalendarBookSelectResource) {
          fetchReservationAvailability(newStartTime)
        } else {
          fetchCalendarEvents(newStartTime)
        }
      }
    }
  }

  type ValuePiece = Date | null;
  const onRangeChange = (selectedDates: [ValuePiece, ValuePiece]) => {
    if (selectedDates.length < 2) {
      // something bad happened, ignore
      console.log("Range selector is chosen for single date select");
      console.log(selectedDates);
      return;
    }
    if (!selectedDates[1]) {
      console.log("End date is not selected. Unsetting range");
      setDailyBookStart(undefined);
      setDailyBookEnd(undefined);
      return;
    }
    // For date range selections, we will ignore (ie. round down) anything below day mark
    const newRangeStartRaw = new Date(selectedDates[0] ? selectedDates[0] : "");
    const newRangeEndRaw = new Date(selectedDates[1] ? selectedDates[1] : "");
    const newRangeStart = new Date(newRangeStartRaw.getFullYear(), newRangeStartRaw.getMonth(), newRangeStartRaw.getDate());
    const newRangeEnd = new Date(newRangeEndRaw.getFullYear(), newRangeEndRaw.getMonth(), newRangeEndRaw.getDate());
    setDailyBookStart(newRangeStart)
    setDailyBookEnd(newRangeEnd)
    startDate?.setDate(newRangeStart.getDate())
    if (onBookingStartTimeChanged) onBookingStartTimeChanged(newRangeStart);
    if (onBookingEndTimeChanged) onBookingEndTimeChanged(newRangeEnd);
  }

  const fetchDay = (newDate: Date) => {
    setStartTime(newDate)
      if (isMounted) {
        if (viewAs === ViewType.CalendarBook || viewAs === ViewType.CalendarBookSelectResource) {
          fetchReservationAvailability(newDate)
        } else {
          fetchCalendarEvents(newDate)
        }
      }
  }

  const loadTranslations = () => {
    getTranslations(id, host, locale).then((translations) => {
      if (translations) {
        setComponentTranslations(translations);
        setPreferredTranslation(getPreferredTranslation(translations, locale))
      } else {
        console.log("There was a problem loading translations: " + JSON.stringify(translations));
      }
    });
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      initializeComponent();
    }
  }, [])

  useEffect(() => {
    if (viewAs === ViewType.MapResourceList) {
      searchForResources(latitude, longitude, selectedPage, resultsPerPage, minDistance, maxDistance, mapBoundNorthEast.current, mapBoundSouthWest.current)
    } else if (viewAs === ViewType.MyResourcesList) {
      getMyResources(selectedPage, resultsPerPage)
    } else if (viewAs === ViewType.ResourceDetail) {
      getMyResourceDetail()
    } else if (viewAs === ViewType.MyReservationsList) {
      getMyReservations(showDate, showEndDate, selectedPage, resultsPerPage)
    } else if (viewAs === ViewType.MyReservationRequestsList) {
      getMyReservationRequests(showDate, showEndDate, selectedPage, resultsPerPage, resourceId)
    }
    loadTranslations() // refresh translations
  }, [id, resourceId, selectedPage, host, authToken, page, locale,
    showDate, showEndDate, location, latitude, longitude,
    priceMin, priceMax, customFilters, resultsPerPage])

  useEffect(() => {
    if (viewAs === ViewType.CalendarBook || viewAs === ViewType.CalendarBookSelectResource) {
      fetchDay(startTime);
    }
  }, [bookingResult])

  useEffect(() => {
    console.log("New component id provided. reloading component with new id: " + id);
    initializeComponent();
  }, [id])

  const initializeComponent = () => {
    // Set timezone and load all timezones
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    setTimezone(timeZone)
    const newTimezoneData: string[] = []
    timezoneData.forEach((tzDefinition: any) => tzDefinition.utc.forEach((tzName: string) => {
      // remove any duplicates
      if (newTimezoneData.indexOf(tzName) < 0) newTimezoneData.push(tzName)
    }));
    timezones.length = 0
    timezones.push(...(newTimezoneData).sort())
    loadTranslations()

    if (showDate) setStartTime(new Date(showDate))
    if (viewAs === ViewType.MapResourceList) {
      searchForResources(latitude, longitude, selectedPage, resultsPerPage, minDistance, maxDistance, mapBoundNorthEast.current, mapBoundSouthWest.current)
    } else if (viewAs === ViewType.MyResourcesList) {
      getMyResources(page, resultsPerPage)
    } else if (viewAs === ViewType.MyReservationsList) {
      getMyReservations(startDate, showEndDate, page, resultsPerPage)
    } else if (viewAs === ViewType.MyReservationRequestsList) {
      getMyReservationRequests(startDate, showEndDate, page, resultsPerPage, resourceId)
    } else if (viewAs === ViewType.ResourceDetail) {
      getMyResourceDetail()
    } else if (startDate) {
      if (showEndDate && viewAs && viewAs === ViewType.List) {
        fetchCalendarEvents(startDate, showEndDate)
      } else if (viewAs === ViewType.CalendarBook || viewAs === ViewType.CalendarBookSelectResource) {
        fetchReservationAvailability(startDate)
      } else {
        fetchCalendarEvents(startDate)
      }
    } else {
      if (viewAs === ViewType.CalendarBook || viewAs === ViewType.CalendarBookSelectResource) {
        fetchReservationAvailability(new Date(new Date().setHours(0, 0, 0, 0)))
      } else {
        fetchCalendarEvents(new Date(new Date().setHours(0, 0, 0, 0)))
      }
    }
  }


  const fetchReservationAvailability = (
    queryStartTime: Date,
    queryEndTime?: Date | undefined,
    getDuration: GetEventsDuration = GetEventsDuration.WholeMonth
  ) => {
    fetchReservationTerms(
      id,
      queryStartTime,
      queryEndTime,
      host,
      authToken,
      resourceId,
      getDuration
    ).then((terms) => {
      if (terms) {
        setAvailability(terms);
      }
    });
  }

  const fetchCalendarEvents = (
    queryStartTime: Date,
    queryEndTime?: Date | undefined
  ) => {
    fetchCalendarView(
      id,
      queryStartTime,
      queryEndTime,
      host,
      authToken,
      location
    ).then((newCalendarEvents) => {
      if (newCalendarEvents) {
        setEvents(newCalendarEvents);
      }
    });
  }

  const DEFAULT_RESULTS_PER_PAGE: number = 20
  const searchForResources = (
    lat?: number,
    lng?: number,
    page?: number,
    resultsLimit?: number,
    minDistance?: number,
    maxDistance?: number,
    northEast?: Point,
    southWest?: Point,
  ) => {
    searchResources(
      id,
      host,
      lat,
      lng,
      authToken,
      page ? page : 1,
      resultsLimit ? resultsLimit : DEFAULT_RESULTS_PER_PAGE,
      priceMin,
      priceMax,
      minDistance,
      maxDistance,
      northEast ? JSON.stringify(northEast) : "",
      southWest ? JSON.stringify(southWest) : "",
      customFilters
    ).then((searchedResources) => {
      setResourceSearchResult(searchedResources)
    })
  }

  const mapRedoSearch = () => {
    searchForResources(latitude, longitude, selectedPage, resultsPerPage, minDistance, maxDistance, mapBoundNorthEast.current, mapBoundSouthWest.current)
  }

  const getMyResources = (page?: number, resultsLimit?: number) => {
    fetchMyResources(
      id,
      host,
      authToken,
      page ? page : 1,
      resultsLimit ? resultsLimit : DEFAULT_RESULTS_PER_PAGE,
    ).then((myResources) => {
      if (myResources) {
        setMyResources(myResources.resources)
        if (myResources.resourceFieldProperties) {
          setResourceProperty(myResources.resourceFieldProperties)
        }
      }
    })
  }

  const getMyReservations = (queryStartTime?: Date, queryEndTime?: Date | undefined, page?: number, resultsLimit?: number) => {
    fetchMyReservations(
      id,
      host,
      authToken,
      queryStartTime,
      queryEndTime,
      page ? page : 1,
      resultsLimit ? resultsLimit : DEFAULT_RESULTS_PER_PAGE,
      reservationStatusFilter
    ).then((reservations) => {
      if (reservations) {
        setMyReservations(reservations)
      }
    })
  }

  const getMyReservationRequests = (queryStartTime?: Date, queryEndTime?: Date | undefined, page?: number, resultsLimit?: number, requestResourceId?: string) => {
    fetchMyReservationRequests(
      id,
      host,
      authToken,
      queryStartTime,
      queryEndTime,
      page ? page : 1,
      resultsLimit ? resultsLimit : DEFAULT_RESULTS_PER_PAGE,
      reservationStatusFilter,
      requestResourceId,
    ).then((requests) => {
      if (requests) {
        setMyReservationRequests(requests)
      }
    })
  }

  const getMyResourceDetail = () => {
    if (resourceId) {
      fetchResourceDetail(
        id,
        resourceId,
        host,
        authToken,
      ).then((detailResponse) => {
        if (detailResponse) {
          setResource(detailResponse?.resource)
          if (detailResponse?.resourceFieldProperties) {
            setResourceProperty(detailResponse?.resourceFieldProperties)
          } else {
            setResourceProperty({})
          }
        }
      })
    } else {
      console.log("Not getting details because ")
    }
  }

  const renderDayCalendarByLocation = () => {
    if (!events || !events.length)
      return (
        <div className='calendar-list-container'>
          <span className='no-events'>No events found</span>
        </div>
      )
    return <DayCalendarGroupedByLocation
        events={events}
        descriptionLength={descriptionLength}
        renderEventFunc={renderEventFunc}
    />;
  }

  const renderCalendarView = () => {
    return (
      <div className='calendar-view-container'>
        <span className='calendar-block'>
          <ReactCalendar
            onChange={onChange}
            locale={locale}
            defaultActiveStartDate={startDate || new Date()}
            defaultValue={startDate}
          />
        </span>
        {!events || !events.length ? (
          <span className='no-events'>No events scheduled for today</span>
        ) : (
          ''
        )}
        {events && events.length > 0 ?
          <EventDetailList events={events} descriptionLength={descriptionLength} renderEventFunc={renderEventFunc} />
        : ''}
      </div>
    )
  }

  const renderCalendarBookSelectResource = () => {
    const dailyMode = availability && availability.resources && availability.resources.length ?
      availability.resources.find(r => r.bookingUnit === CalendarBookingUnit.Daily) : false;

    return (
      <div className='calendar-view-container'>
        <span className='calendar-block'>
          <ReactCalendar
            onChange={dailyMode ? onRangeChange : onChange}
            locale={locale}
            selectRange={dailyMode ? true : undefined}
            allowPartialRange={dailyMode ? true : false}
            defaultActiveStartDate={startDate || new Date()}
            onActiveStartDateChange={({ action, activeStartDate, value, view }) => {
              if (activeStartDate) {
                const activeDate = new Date(activeStartDate);
                fetchReservationAvailability(activeStartDate, addDays(activeStartDate, 31));
                if (onCalendarMonthChanged) onCalendarMonthChanged(activeDate);
              }
            }}
            defaultValue={startDate}
          />
        </span>
        {renderAvailableTimes()}
        <div className='timezone-selector-block'>
          <div className='header'>{getTranslation(preferredTranslation, "time_zone")}</div>
          {getTimezoneSelector(true)}
        </div>
        {bookingResult ? 
          <ReservationSuccessModal
            key={'reservation-success'}
            timezone={timezone.toString()}
            bookingResult={bookingResult}
            locale={locale}
            translation={preferredTranslation}
            onClose={() => {
              setBookingResult(undefined)
            }}
          /> : <span className="empty-modal"></span>}
        {bookingDialog ? reserveDialog(bookingDialog) : <span className="empty-modal"></span>}
      </div>

    )
  }

  const renderCalendarBook = () => {
    // TODO figure out a way to place dots on top of dates that have availability
    // When one or more resources are selectable in daily fashion, all are considered daily and the interface will show the daily one
    const dailyMode = availability && availability.resources && availability.resources.length ?
      availability.resources.find(r => r.bookingUnit === CalendarBookingUnit.Daily) : false;

    // if daily mode, then show resource selector if there's more than one resource
    if (dailyMode) {
      const resourceCount = availability && availability.resources ? availability.resources.length : 0;
      if ((resourceCount > 1) && !resourceIdSelected)
        return renderCalendarDailySelectResource()
      return renderCalendarDailyBook()
    }
    return renderCalendarBookByTimeSlot()
  }

  const setResourceIdFunc = (newResourceId: string) => {
    if (!availability) {
      console.log("ERROR: Calendar is not loaded. Please make sure you are invoking this function after the calendar is loaded in daily booking mode.")
      return
    }
    const chosenResource = availability.resources.find(r => r._id === newResourceId);
    if (!chosenResource) {
      console.log("ERROR: Resource id " + newResourceId + " not found. Please make sure you are returning a valid resource id.")
      return
    }
    setResourceIdSelected(newResourceId)
  }

  const renderCalendarDailySelectResource = () => {
    const resources = availability && availability.resources ? availability.resources : [];
    if (renderBookingResourcesSelectionFunc) {
      return renderBookingResourcesSelectionFunc(resources, setResourceIdFunc)
    }
    return (
        <div className='calendar-view-container'>
          {getTranslation(preferredTranslation, "select_a_resource_to_book")}
          {resources.map(r => {
            return <div key={r._id + "-resource"}>
            <Button className='select-resource-button' onClick={() => {setResourceIdFunc(r._id)}}>{r.name}</Button>
            </div>;
          })}
        </div>
      )
  }

  const increaseDateByIncrementAndUnit = (originalDate: Date, increment: number, unit: TimeUnit) => {
    const mutatedDate = new Date(originalDate);
    switch (unit) {
      case TimeUnit.YEARLY:
        mutatedDate.setFullYear(mutatedDate.getFullYear() + increment);
        break;
      case TimeUnit.MONTHLY:
        mutatedDate.setMonth(mutatedDate.getMonth() + increment);
        break;
      case TimeUnit.WEEKLY:
        mutatedDate.setDate(mutatedDate.getDate() + increment * 7);
        break;
      case TimeUnit.DAILY:
        mutatedDate.setDate(mutatedDate.getDate() + increment);
        break;
      case TimeUnit.HOURLY:
        mutatedDate.setHours(mutatedDate.getHours() + increment);
        break;
      case TimeUnit.MINUTELY:
        mutatedDate.setMinutes(mutatedDate.getMinutes() + increment);
        break;
      case TimeUnit.SECONDLY:
        mutatedDate.setSeconds(mutatedDate.getSeconds() + increment);
        break;
    }
    return mutatedDate;
  }

  const renderCalendarDailyBook = () => {
    let chosenResource: BookingResource | undefined = undefined;
    if (availability && availability.resources && availability.resources.length > 0) {
      chosenResource = availability.resources.find(r => r._id === resourceIdSelected);
      if (!chosenResource) {
        console.log("ERROR: Resource id " + resourceIdSelected + " not found. Using default resource.")
      }
      if (!chosenResource) chosenResource = availability.resources[0];
    }
    if (!chosenResource) {
      return <div>Please wait until availabilities are loaded. You do not have a resource chosen and availabilities loaded</div>;
    }
    let maxDate: Date | undefined = undefined;
    if (chosenResource.reservableUntilType === CalendarEventReservableUntilType.FixedTime && chosenResource.availabilityEndTime) {
      maxDate = new Date(chosenResource.availabilityEndTime);
    } else if (chosenResource.reservableUntilType === CalendarEventReservableUntilType.Duration && Number(chosenResource.reservableUntil) > 0) {
      const increment = Number(chosenResource.reservableUntil);
      maxDate = increaseDateByIncrementAndUnit(new Date(), increment, chosenResource.reservableUntilUnit);
    }
    const canSelectPast = chosenResource.processPastEvents;
    let minDate: Date | undefined = canSelectPast ? undefined :new Date();
    if (chosenResource.availabilityStartTime) {
      const specifiedStartTime = new Date(chosenResource.availabilityStartTime);
      minDate = minDate ? (specifiedStartTime.getTime() > minDate.getTime() ? specifiedStartTime : minDate) : specifiedStartTime;
    }
    return (
        <div className='calendar-view-container'>
          {chosenResource ? chosenResource.name : ""}
          <span className='calendar-block'>
            <ReactCalendar
              onChange={onRangeChange}
              locale={locale}
              selectRange={true}
              minDate={minDate}
              maxDate={maxDate}
              allowPartialRange={true}
              defaultActiveStartDate={startDate || new Date()}
              onActiveStartDateChange={({ action, activeStartDate, value, view }) => {
                if (activeStartDate) {
                  const activeDate = new Date(activeStartDate);
                  fetchReservationAvailability(activeStartDate, addDays(activeStartDate, 31));
                  if (onCalendarMonthChanged) onCalendarMonthChanged(activeDate);
                }
              }}
              tileDisabled={({ activeStartDate, date, view }) => {
                if (minDate && date.getTime() < minDate.getTime()) return true;
                if (maxDate && date.getTime() > maxDate.getTime()) return true;
                if (chosenResource) {
                  const beginOfDay = convertTimezoneOfDay(date, chosenResource.timezone);
                  if (chosenResource.availableTimes && chosenResource.availableTimes.length > 0) {
                    const availableIdx = chosenResource.availableTimes.findIndex(at => {
                      const atDateStartTime = convertTimezoneOfDay(at.startTimeUtc, chosenResource!.timezone);
                      const atDateEndTime = convertTimezoneOfDay(at.endTimeUtc, chosenResource!.timezone);
                      return (atDateStartTime.getTime() <= beginOfDay.getTime()) && (atDateEndTime.getTime() >= beginOfDay.getTime());
                    });
                    if (availableIdx >= 0) return false;
                  }
                  if (chosenResource.unavailableTimes && chosenResource.unavailableTimes.length > 0) {
                    const unavailableIdx = chosenResource.unavailableTimes.findIndex(ut => {
                      const utDateStartTime = convertTimezoneOfDay(ut.startTimeUtc, chosenResource!.timezone);
                      const utDateEndTime = convertTimezoneOfDay(ut.endTimeUtc, chosenResource!.timezone);
                      return (utDateStartTime.getTime() <= beginOfDay.getTime()) && (utDateEndTime.getTime() >= beginOfDay.getTime());
                    });
                    if (unavailableIdx >= 0) return true;
                  }
                }
                // unspecified time ranges are assumed to be available
                return false;
              }}
              defaultValue={startDate}
            />
          </span>
          <span className='daily-book-time-container'>
            {resourceIdSelected ?
              <div className='daily-book-time-container-back-button'>
                <Button className='reset-resource-selection' disabled={!resourceIdSelected} onClick={() => {
                  setResourceIdSelected("");
                }}>Back</Button>
              </div>
            : ''}
            <div className='daily-book-time-container-book-button'>
              <Button className='reserve-slot-button' disabled={!dailyBookStart || !dailyBookEnd} onClick={() => {
                const newBooking = {
                  resource: chosenResource,
                  startTimeUtc: dailyBookStart,
                  endTimeUtc: dailyBookEnd,
                  timezone: timezone,
                } as BookingRequestResource
                setBookingDialog(newBooking);
              }}>Book</Button>
            </div>
          </span>
        {bookingResult ? 
          <ReservationSuccessModal
            key={'reservation-success'}
            timezone={timezone.toString()}
            bookingResult={bookingResult}
            locale={locale}
            translation={preferredTranslation}
            onClose={() => {
              setBookingResult(undefined)
            }}
          /> : <span className="empty-modal"></span>}
        {bookingDialog ? reserveDialog(bookingDialog) : <span className="empty-modal"></span>}
        </div>
      )
  }

  const renderCalendarBookByTimeSlot = () => {
    return (
      <div className='calendar-view-container'>
        <span className='calendar-block'>
          <ReactCalendar
            onChange={onChange}
            locale={locale}
            defaultActiveStartDate={startDate || new Date()}
            defaultValue={startDate}
          />
        </span>
        {renderAvailableTimes()}
        <div className='timezone-selector-block'>
          <div className='header'>{getTranslation(preferredTranslation, "time_zone")}</div>
          {getTimezoneSelector(true)}
        </div>
        {bookingResult ?
          <ReservationSuccessModal
            key={'reservation-success'}
            timezone={timezone.toString()}
            bookingResult={bookingResult}
            locale={locale}
            translation={preferredTranslation}
            onClose={() => {
              setBookingResult(undefined)
            }}
          /> : <span className="empty-modal"></span>}
        {bookingDialog ? reserveDialog(bookingDialog) : <span className="empty-modal"></span>}
      </div>
    )
  }

  const renderAvailableTimes = () => {
    if (!availability || !availability.resources) return <div className='availabilities'><span className='empty'>There are no availabilities for the given time frame</span></div>;
    const dailyMode = availability && availability.resources && availability.resources.length ?
      availability.resources.find(r => r.bookingUnit === CalendarBookingUnit.Daily) : false;
    const availableTimes = <AvailabilitiesForADay
      timezone={timezone.toString()}
      availability={availability}
      startTimeUtc={dailyMode ? dailyBookStart : startTime}
      endTimeUtc={dailyMode ? dailyBookEnd : undefined}
      locale={locale ? locale : "en-US"}
      translation={preferredTranslation}
      renderResourceForSingularBookingFunc={renderResourceForSingularBookingFunc}
      onPress={(requestResource) => {
        setBookingDialog(requestResource);
      }}
    />;
    if (availableTimes) return availableTimes!;
    return <div></div>;
  }

  const reserveDialog = (reservingResource: BookingRequestResource) => {
    if (!reservingResource || !reservingResource.startTimeUtc || !reservingResource.endTimeUtc || !reservingResource.resource) return <div className='dialog-content'></div>
    return <ReservationModalWrapper
      componentId={id}
      timezone={timezone.toString()}
      resource={reservingResource}
      host={host}
      locale={locale}
      translation={preferredTranslation}
      authToken={authToken}
      onClose={() => setBookingDialog(undefined)}
      paymentProcessorPublicKey={paymentProcessorPublicKey}
      defaultEmail={bookingDefaultEmail}
      defaultName={bookingDefaultName}
      submitPressed={(res, req) => {
        bookReservation(id,req,host,authToken).then((bookResponse) => {
          if (bookResponse) {
            if (bookResponse.success) {
              // clear error message, and show success message.
              setBookingDialog(undefined)
              setBookingResult({
                resource: res,
                response: bookResponse,
                request: req
              } as BookingResultPage)
            } else {
              toast(getTranslation(preferredTranslation, "booking_error_generic"));
            }
          } else {
            toast(getTranslation(preferredTranslation, "booking_error_generic"));
          }
          setBookingDialog(undefined) // this closes current dialog
        })
      }}
    />;
  }

  const getTimezoneSelector = (selectSelectedTimezone: boolean = false) => {
    // TODO Add filter (https://react-bootstrap.netlify.app/docs/components/dropdowns#custom-dropdown-components)
    return <Dropdown className='timezone-selector' onSelect={e => { if (e && e.startsWith('#')) setTimezone(e.slice(1))}}>
      <Dropdown.Toggle variant="link" id="dropdown-basic">
        {selectSelectedTimezone ? timezone.toString(): ''}
      </Dropdown.Toggle>
      <Dropdown.Menu className='dropdown-height-cap' style={{height: "400px", overflowY: "auto"}}>
        {
          timezones.map((zone: string) => {
            return <Dropdown.Item key={zone} href={'#' + zone}>{zone.replaceAll('_', ' ')}</Dropdown.Item>
          })
        }
      </Dropdown.Menu>
    </Dropdown>
  }

  const renderDayListWithDaySelector = () => {
    return (
      <div className='calendar-list-container calendar-list-container-day-selector'>
        <div className='day-selector'>
          {startTime.toDateString()}
          <button onClick={() => fetchDay(addDays(startTime, 1))}>&gt;</button>
          <button onClick={() => fetchDay(addDays(startTime, -1))}>&lt;</button>
        </div>
        {!events || !events.length ? (
          <span className='no-events'>No events scheduled for today</span>
        ) : (
          ''
        )}
        {events && events.length > 0 ?
          <EventDetailList events={events} descriptionLength={descriptionLength} renderEventFunc={renderEventFunc} />
        : ''}
      </div>
    )
  }

  const renderDayList = () => {
    return (
      <div className='calendar-list-container calendar-list-container-day-view'>
        {!events || !events.length ? (
          <span className='no-events'>No events scheduled for today</span>
        ) : (
          ''
        )}
        {events && events.length > 0 ?
          <EventDetailList events={events} descriptionLength={descriptionLength} renderEventFunc={renderEventFunc} />
        : ''}
      </div>
    )
  }

  const renderList = () => {
    return (
      <div className='calendar-list-container'>
        {!events || !events.length ? (
          <span className='no-events'>No events found</span>
        ) : (
          ''
        )}
        {events && events.length > 0 ?
          <EventListGroupedByDay
            events={events}
            descriptionLength={descriptionLength}
            renderEventFunc={renderEventFunc} />
        : ''}
      </div>
    )
  }

  const renderMyReservations = () => {
    return (
      <div className='my-reservations-container'>
        { myReservationsHead ? myReservationsHead : ""}
        {!myReservations || !myReservations.reservations || !myReservations.reservations.length ? (
          <div className='no-reservation'>No reservations</div>
        ) : (
          myReservations!.reservations.map((r, idx) => {
          const cancelBtn = <Button className='reserve-slot-button' onClick={async () => {
            const resp = await cancelReservation(r.reservationId, host, authToken, r.reservationModerationKey);
            if (onAction) onAction(resp.success ? ActionType.ReservationCancelled : ActionType.ReservationNotCancelled, resp);
            if (resp.success) {
              let reservations = myReservations.reservations.map((rez) => {
                if (rez._id === r._id) {
                  const rez2 = rez;
                  rez2.status = EventReservationStatus.Canceled;
                  return rez2;
                } else return rez;
              });
              const newMyReservations = myReservations;
              newMyReservations.reservations = reservations;
              setMyReservations(newMyReservations);
              forceUpdate({});
            }
          }}>Cancel</Button>;
          if (renderMyReservationFunc) return renderMyReservationFunc(r, idx, cancelBtn);
          return <div className='my-reservation' key={r._id + "-reservation-" + idx}>
            <div>{r.title}</div>
            <div>{r.notes}</div>
            {cancelBtn}
          </div>
        }))}
      </div>
    )
  }

  const renderMyReservationRequests = () => {
    // 1. group reservations by resource id
    const requestsById: {[resourceId: string]: EventReservation[]} = {};
    if (myReservationRequests && myReservationRequests.reservations) {
      myReservationRequests.reservations.forEach(r => {
        if (r.componentResourceId) {
          let requestList = requestsById[r.componentResourceId];
          if (!requestList) requestList = [];
          requestList.push(r);
          requestsById[r.componentResourceId] = requestList;
        }
      });
    }
    const requestedResources: string[] = Object.keys(requestsById);
    return (
      <div className='my-reservation-requests-container'>
        { myReservationsHead ? myReservationsHead : ""}
        {!requestedResources.length ? (
          <div className='no-reservation-request'>No reservation requests</div>
        ) : (
          requestedResources.map((requestResourceId, idx) => {
          const requests = requestsById[requestResourceId];
          if (!requests || !requests.length) return <div className='my-reservation-requests-resource-group-container'></div>;
          return requests && requests.length ? requests.map((r, idx) => {
              const acceptBtn = <Button className={r.status === EventReservationStatus.Requested ? 'reserve-slot-button' : 'reserve-slot-button hideImportant'} onClick={ async () => {
                const resp = await moderateReservation(id, r.reservationId,  EventReservationStatus.Reserved, host, authToken);
                if (onAction) onAction(resp ? ActionType.ReservationAccepted : ActionType.ReservationRejectionFailed);
                if (resp) {
                  if (myReservationRequests && myReservationRequests.reservations) {
                    let reservations = myReservationRequests.reservations.map((rez) => {
                      if (rez._id === r._id) {
                        const rez2 = rez;
                        rez2.status = EventReservationStatus.Reserved;
                        return rez2;
                      } else return rez;
                    });
                    const myReservationRequests2 = myReservationRequests;
                    myReservationRequests2.reservations = reservations;
                    setMyReservationRequests(myReservationRequests2);
                    forceUpdate({});
                  }
                }
              }}>Approve</Button>;
              const rejectBtn = <Button className={r.status === EventReservationStatus.Requested ? 'reserve-slot-button' : 'reserve-slot-button hideImportant'} onClick={ async () => {
                const resp = await moderateReservation(id, r.reservationId, EventReservationStatus.Canceled, host, authToken);
                if (onAction) onAction(resp ? ActionType.ReservationRejected : ActionType.ReservationRejectionFailed);
                if (resp) {
                  if (myReservationRequests && myReservationRequests.reservations) {
                    let reservations = myReservationRequests.reservations.map((rez) => {
                      if (rez._id === r._id) {
                        const rez2 = rez;
                        rez2.status = EventReservationStatus.Canceled;
                        return rez2;
                      } else return rez;
                    });
                    const myReservationRequests2 = myReservationRequests;
                    myReservationRequests2.reservations = reservations;
                    setMyReservationRequests(myReservationRequests2);
                    forceUpdate({});
                  }
                } else {
                  console.log("resp is empty");
                }
              }}>Decline</Button>;
              const cancelBtn = <Button className='reserve-slot-button' onClick={ async () => {
                const resp = await cancelReservation(r.reservationId, host, authToken, r.reservationModerationKey);
                if (onAction) onAction(resp.success ? ActionType.ReservationCancelled : ActionType.ReservationNotCancelled, resp);
                if (resp.success) {
                  if (myReservationRequests && myReservationRequests.reservations) {
                    let reservations = myReservationRequests.reservations.map((rez) => {
                      if (rez._id === r._id) {
                        const rez2 = rez;
                        rez2.status = EventReservationStatus.Canceled;
                        return rez2;
                      } else return rez;
                    });
                    const myReservationRequests2 = myReservationRequests;
                    myReservationRequests2.reservations = reservations;
                    setMyReservationRequests(myReservationRequests2);
                    forceUpdate({});
                  }
                }
              }}>Cancel</Button>;
              if (renderEventReservationFunc) return renderEventReservationFunc(r, idx, acceptBtn, rejectBtn, cancelBtn);
              return <div className='my-reservation-request' key={r.eventId + "-reservation-request-" + idx}>
                <div>{r.title}</div>
                <div>{r.notes}</div>
                {acceptBtn}
                {rejectBtn}
                {cancelBtn}
              </div>
            }) : <span key={requestResourceId + "-reservation-request-" + idx}></span>;
        }))}
      </div>
    )
  }

  const renderMyResources = () => {
    // add buttons, some more styles
    return (
      <div className='my-resources-container'>
        {!myResources || !myResources.length ? (
          <span className='no-resources'>No resources</span>
        ) : (
          ''
        )}
        {myResources.map((myResource, idx) => {
          if (renderResourceFunc) return renderResourceFunc(myResource, idx, () => { return toggleVisibility(myResource) })
          return <div className='my-resource' key={myResource._id + "-resource-" + idx} onClick={() => onResourceSelected ? onResourceSelected(myResource) : ''}>
            {myResource.name}
          </div>
        })}
      </div>
    )
  }

  // returns the new visibility status, empty if not updated
  const toggleVisibility = async (resource: PrivateCalendarResource): Promise<string> => {
    const detailResponse = await fetchResourceDetail(id, resource._id, host, authToken);
    if (!detailResponse || !detailResponse.resource) return "";
    const updatingResource = detailResponse.resource;
    // status at the moment can only be either "published" or "hidden"
    const newStatus = updatingResource.status === "hidden" ? "published" : "hidden";
    const result = await updateResource({
      ...updatingResource,
      status: newStatus
    });
    if (!result) return "";
    return newStatus;
  }

  const updateResource = async (resource: any): Promise<PrivateCalendarResource | undefined> => {
    const hostUrl = host + CALENDAR_RESOURCE_MY_RESOURCE_ENDPOINT;
    try {
        const json = await fetch(hostUrl, {
            headers: new Headers({
              Authorization: authToken ? 'Bearer ' + authToken : '',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }),
            method: 'PATCH',
            body: JSON.stringify({
                id: id,
                resource: resource
            }),
        });
        if (json) {
            const response = await json.json();
            if (response) {
                console.log('update result')
                console.log(response)
                return response as PrivateCalendarResource;
            }
        }
        return undefined;
    } catch (error) {
        console.log(error);
        return undefined;
    }
  };

  const renderResourceDetail = () => {
    if (renderResourceFunc && resource) return renderResourceFunc(resource, 0);
    return <div>
      Loading...
    </div>
  }

  const renderMapResourcesView = () => {
    return <MapResourceList
      googleMapsApiKey={googleMapsApiKey}
      locale={locale}
      translation={preferredTranslation}
      resources={resourceSearchResult ? resourceSearchResult : []}
      descriptionLength={descriptionLength}
      currentPage={selectedPage ? selectedPage : 1}
      paginationStyle={paginationStyle}
      latitude={latitude}
      longitude={longitude}
      defaultZoom={defaultMapZoom}
      markerImageUrl={mapMarkerImageUrl}
      markerImageMouseOverUrl={mapMarkerImageMouseOverUrl}
      markerImageWidth={mapMarkerImageWidth}
      markerImageHeight={mapMarkerImageHeight}
      markerLabelFunc={mapMarkerLabelFunc}
      renderMarkerInfoWindowFunc={renderMapMarkerInfoWindowFunc}
      renderResourceFunc={renderResourceFunc}
      onPagePressed={handlePageChange}
      onMapBoundsChanged={handleBoundsChange}
      redoSearchFunc={mapRedoSearch}
    />;
  }

  const handleBoundsChange = (northEast?: Point, southWest?: Point) => {
    mapBoundNorthEast.current = northEast;
    mapBoundSouthWest.current = southWest;
  }

  const handlePageChange = (newPage: number) => {
    console.log('new page selected: ' + newPage)
    setSelectedPage(newPage);
  }

  const renderView = () => {
    if (!viewAs || viewAs === ViewType.List) return renderList()
    if (viewAs === ViewType.CalendarView) return renderCalendarView()
    if (viewAs === ViewType.DayList) return renderDayListWithDaySelector()
    if (viewAs === ViewType.DayView) return renderDayList()
    if (viewAs === ViewType.DayViewByLocation) return renderDayCalendarByLocation()
    if (viewAs === ViewType.CalendarBook) return renderCalendarBook()
    if (viewAs === ViewType.CalendarBookSelectResource) return renderCalendarBookSelectResource()
    if (viewAs === ViewType.MyResourcesList) return renderMyResources()
    if (viewAs === ViewType.MyReservationsList) return renderMyReservations()
    if (viewAs === ViewType.MyReservationRequestsList) return renderMyReservationRequests()
    if (viewAs === ViewType.ResourceDetail) return renderResourceDetail()
    if (viewAs === ViewType.MapResourceList) return renderMapResourcesView()
    return renderList()
  }

  return <div className='airjam-calendar-view'>
    {renderView()}
    {cssTheme && (cssTheme === CssTheme.Bootstrap) && 
      <React.Suspense fallback={<div />}>
        <BootstrapTheme />
      </React.Suspense>
    }
    <ToastContainer />
    </div>
}
