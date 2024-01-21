import React, { useEffect, useState } from 'react';
import { Calendar as ReactCalendar } from 'react-calendar';

import 'react-calendar/dist/Calendar.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { Value } from 'react-calendar/dist/cjs/shared/types';

import Dropdown from 'react-bootstrap/Dropdown';
import { CalendarViewType as ViewType, CalendarEvent, CalendarBookingAvailability, addDays, GetEventsDuration } from '@airjam/types';
import { Props } from './Props';
import { BookingResultPage } from './BookingResultPage';
import { BookingRequestResource } from './BookingRequestResource';
import { ToastContainer, toast } from 'react-toastify';
import { bookReservation, fetchCalendarView, fetchReservationTerms } from './thunk';
import { timezoneData } from './timezone_data';
import { ReservationSuccessModal } from './ReservationSuccessModal';
import { ReservationModal } from './ReservationModal';
import { EventDetailList } from './EventDetailList';
import { AvailabilitiesForADay } from './AvailabilitiesForADay';
import { DayCalendarGroupedByLocation } from './DayCalendarGroupedByLocation';
import { EventListGroupedByDay } from './EventListGroupedByDay';

export { CalendarViewType as ViewType } from '@airjam/types';

const timezones: string[] = []

export const Calendar = ({
  id,
  authToken,
  host,
  renderEventFunc,
  viewAs,
  showDate,
  showEndDate,
  location,
  descriptionLength
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
  const startDate = showDate || undefined
  const onChange = (newDate: Value) => {
    if (newDate) {
      const newStartTime: Date = new Date(newDate.toString())
      setStartTime(newStartTime)
      if (isMounted) {
        if (viewAs === ViewType.CalendarBook) {
          fetchReservationAvailability(newStartTime)
        } else {
          fetchCalendarEvents(newStartTime)
        }
      }
    }
  }

  const fetchDay = (newDate: Date) => {
    setStartTime(newDate)
      if (isMounted) {
        if (viewAs === ViewType.CalendarBook) {
          fetchReservationAvailability(newDate)
        } else {
          fetchCalendarEvents(newDate)
        }
      }
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)

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

      if (showDate) setStartTime(new Date(showDate))
      if (startDate) {
        if (showEndDate && viewAs && viewAs === ViewType.List) {
          fetchCalendarEvents(startDate, showEndDate)
        } else if (viewAs === ViewType.CalendarBook) {
          fetchReservationAvailability(startDate)
        } else {
          fetchCalendarEvents(startDate)
        }
      } else {
        if (viewAs === ViewType.CalendarBook) {
          fetchReservationAvailability(new Date(new Date().setHours(0, 0, 0, 0)))
        } else {
          fetchCalendarEvents(new Date(new Date().setHours(0, 0, 0, 0)))
        }
      }
    }
  }, [])

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

  const renderCalendarBook = () => {
    // TODO figure out a way to place dots on top of dates that have availability

    return (
      <div className='calendar-view-container'>
        <span className='calendar-block'>
          <ReactCalendar
            onChange={onChange}
            defaultActiveStartDate={startDate || new Date()}
            defaultValue={startDate}
          />
        </span>
        {renderAvailableTimes()}
        <div className='timezone-selector-block'>
          <div className='header'>Time zone</div>
          {getTimezoneSelector(true)}
        </div>
        {bookingResult ? 
          <ReservationSuccessModal
            key={'reservation-success'}
            timezone={timezone.toString()}
            bookingResult={bookingResult}
            onClose={() => setBookingResult(undefined)}
          /> : <div className="empty-modal"></div>}
        {bookingDialog ? reserveDialog(bookingDialog) : <div className="empty-modal">no modal for you</div>}
      </div>
    )
  }

  const renderAvailableTimes = () => {
    if (!availability || !availability.resources) return <div className='availabilities'><span className='empty'>There are no availabilities for the given time frame</span></div>;
    const availableTimes = <AvailabilitiesForADay
      timezone={timezone.toString()}
      availability={availability}
      startTimeUtc={startTime}
      onPress={(requestResource) => {
        setBookingDialog(requestResource);
      }}
    />;
    if (availableTimes) return availableTimes!;
    return <div></div>;
  }

  const reserveDialog = (resource: BookingRequestResource) => {
    if (!resource || !resource.startTimeUtc || !resource.endTimeUtc || !resource.resource) return <div className='dialog-content'></div>
    return <ReservationModal
      componentId={id}
      timezone={timezone.toString()}
      resource={resource}
      onClose={() => setBookingDialog(undefined)}
      submitPressed={(res, req) => {
          bookReservation(id,req,host).then((bookResponse) => {
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
                toast("There was an error booking. Please try again later");
              }
            } else {
                toast("There was an error booking. Please try again later");
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
      <Dropdown.Menu>
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

  const renderView = () => {
    if (!viewAs || viewAs === ViewType.List) return renderList()
    if (viewAs === ViewType.CalendarView) return renderCalendarView()
    if (viewAs === ViewType.DayList) return renderDayListWithDaySelector()
    if (viewAs === ViewType.DayView) return renderDayList()
    if (viewAs === ViewType.DayViewByLocation) return renderDayCalendarByLocation()
    if (viewAs === ViewType.CalendarBook) return renderCalendarBook()
    return renderList()
  }

  return <div className='airjam-calendar-view'>
    {renderView()}
    <ToastContainer />
    </div>
}
