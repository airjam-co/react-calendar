/* eslint-disable no-unused-vars */
import * as React from 'react'
import { Calendar as ReactCalendar } from 'react-calendar'

import 'react-calendar/dist/Calendar.css'
import { useEffect, useState } from 'react'
import { Value } from 'react-calendar/dist/cjs/shared/types'

const DEFAULT_HOST = "https://airjam.co";
const CALENDAR_CONFIG_ENDPOINT = '/s/calendar?id='
const DEFAULT_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}
const DEFAULT_DESCRIPTION_LENGTH_CUTOFF = 30

interface Props {
  id: string
  authToken?: string
  host?: string
  location?: string
  showDate?: Date
  showEndDate?: Date
  viewAs?: ViewType
  descriptionLength?: number
  renderEventFunc?: (event: Event, index: number) => React.JSX.Element
}

export enum ViewType {
  CalendarView = 'CALENDAR_VIEW',
  DayView = 'DAY_VIEW',
  DayViewByLocation = 'DAY_VIEW_BY_LOCATION',
  DayList = 'DAY_LIST',
  List = 'LIST'
}

export interface Event {
  start: Date
  startTimezone: String
  end: Date
  endTimezone: String
  allDay: Boolean
  title: String
  description: String
  status: String
  location: String
}

const addDays = (date: Date, days: number) => {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() + days)
  return newDate
}

const compareEventsByStartTime = (a: Event, b: Event) => {
  if (a.start < b.start) {
    return -1
  }
  if (a.start > b.start) {
    return 1
  }
  return 0
}

export const Calendar = ({
  id,
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
  const [events, setEvents] = React.useState<Event[] | undefined>(undefined)
  const [isMounted, setIsMounted] = React.useState<Boolean>(false)
  const startDate = showDate || undefined
  const onChange = (newDate: Value) => {
    if (newDate) {
      const newStartTime: Date = new Date(newDate.toString())
      console.log('before: ' + startTime)
      // change
      setStartTime(newStartTime)
      if (isMounted) fetchCalendar(newStartTime)
    }
  }

  const fetchDay = (newDate: Date) => {
    console.log('moving to: ' + newDate)
    setStartTime(newDate)
    if (isMounted) fetchCalendar(newDate)
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      if (startDate) {
        if (showEndDate && viewAs && viewAs === ViewType.List) {
          fetchCalendar(startDate, showEndDate)
        } else {
          fetchCalendar(startDate)
        }
      } else {
        fetchCalendar(new Date(new Date().setHours(0, 0, 0, 0)))
      }
    }
  }, [])

  const fetchCalendar = (
    queryStartTime: Date,
    queryEndTime?: Date | undefined
  ) => {
    let hostUrl = host || DEFAULT_HOST
    hostUrl +=
      CALENDAR_CONFIG_ENDPOINT +
      id +
      '&startTimeUtc=' +
      queryStartTime.toISOString()
    if (queryEndTime) {
      hostUrl += '&endTimeUtc=' + queryEndTime!.toISOString()
    } else {
      hostUrl += '&endTimeUtc=' + addDays(queryStartTime, 1).toISOString()
    }
    if (location) {
      hostUrl += '&location=' + encodeURIComponent(location)
    }
    fetch(hostUrl).then((json) => {
      if (json) {
        json.json().then((response: any) => {
          if (response && response.events) {
            const newEvents: Event[] = []
            for (const e of response.events) {
              e.start = e.calculatedStartTimeUtc
                ? e.calculatedStartTimeUtc
                : e.startTimeUtc
              e.end = e.calculatedRecurrenceEndTimeUtc
                ? e.calculatedRecurrenceEndTimeUtc
                : e.endTimeUtc
              e.allDay = e.isAllDay
              newEvents.push(e)
            }
            newEvents.sort(compareEventsByStartTime) // sort events by start time
            setEvents(newEvents)
          }
        })
      } else {
        console.log('unfortunately i wont be able to render the results')
      }
    })
  }

  const getEventTime = (event: Event) => {
    const start = new Date(event.start)
    const end = new Date(event.end)
    const isAllDay: Boolean = event.allDay
    if (isAllDay) return 'All Day'
    if (end && end > new Date(0)) {
      return (
        start.toLocaleTimeString([], DEFAULT_TIME_FORMAT) +
        ' ~ ' +
        end.toLocaleTimeString([], DEFAULT_TIME_FORMAT)
      )
    }
    return start.toLocaleTimeString([], DEFAULT_TIME_FORMAT)
  }

  const renderEvent = (event: Event, idx: number) => {
    let description = event.description ? event.description : ''
    const descLimit = descriptionLength || DEFAULT_DESCRIPTION_LENGTH_CUTOFF
    if (descLimit > 2 && description.length > descLimit)
      description = description.substring(0, descLimit - 3) + '...'
    return (
      <div key={'e-' + idx} className='event-block'>
        <span className='time-block'>{getEventTime(event)}</span>
        <span className='description-block'>
          <span className='title'>{event.title}</span>
          <span className='description'>{description}</span>
          <span className='location'>{event.location}</span>
        </span>
      </div>
    )
  }

  const renderEvents = (events: Event[]) => {
    return (
      <span className='calendar-events'>
        {events.map(function (e, idx) {
          if (renderEventFunc) return renderEventFunc(e, idx)
          return renderEvent(e, idx)
        })}
      </span>
    )
  }

  const renderCalendarByLocation = () => {
    if (!events || !events.length)
      return (
        <div className='calendar-list-container'>
          <span className='no-events'>No events found</span>
        </div>
      )

    const eventsByLocations: Map<String, Event[]> = new Map<String, Event[]>()
    for (let i = 0; i < events.length; i++) {
      const location = events[i].location ? events[i].location : ''
      let locationEvents: Event[] = []
      if (eventsByLocations.has(location))
        locationEvents = eventsByLocations.get(location)!
      locationEvents.push(events[i])
      eventsByLocations.set(location, locationEvents)
    }
    console.log(eventsByLocations)

    const uniqueLocations: String[] = []
    for (const entry of Array.from(eventsByLocations.entries())) {
      const key = entry[0]
      uniqueLocations.push(key)
    }
    uniqueLocations.sort()
    return (
      <div className='calendar-location-list-container'>
        {uniqueLocations.map(function (key, idx) {
          console.log(key + ':' + idx)
          if (!eventsByLocations.has(key)) return ''
          return (
            <div key={'location' + idx} className='cleandar-location-container'>
              <div className='location-header'>{key}</div>
              {renderEvents(eventsByLocations.get(key)!)}
            </div>
          )
        })}
      </div>
    )
  }

  const renderEventsByDay = (events: Event[]) => {
    const eventByDays: Map<number, Event[]> = new Map<number, Event[]>()
    for (let i = 0; i < events.length; i++) {
      if (events[i].start) {
        const startDate = new Date(events[i].start)
        let dayToUse = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )
        if (events[i].allDay) {
          dayToUse = new Date(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate()
          )
        }
        const dayIdx = dayToUse.getTime() / 1000

        let dayEvents: Event[] = []
        if (eventByDays.has(dayIdx)) {
          dayEvents = eventByDays.get(dayIdx)!
        }
        dayEvents.push(events[i])
        eventByDays.set(dayIdx, dayEvents)
      } else {
        console.log('Ignoring erroneous event')
        console.log(events[i])
      }
    }
    const keys: number[] = []
    for (const entry of Array.from(eventByDays.entries())) {
      const key = entry[0]
      keys.push(key)
    }
    keys.sort()
    return (
      <span className='calendar-events'>
        {keys.map(function (key) {
          if (eventByDays.has(key)) {
            return renderEventGroupedByDay(eventByDays.get(key), key)
          }
          return ''
        })}
      </span>
    )
  }

  const renderEventGroupedByDay = (
    events: Event[] | undefined,
    dayTimestamp: number
  ) => {
    if (!events || !events.length || !events[0].start) return ''
    const startDay = new Date(events[0].start)
    let dayToUse = new Date(
      startDay.getFullYear(),
      startDay.getMonth(),
      startDay.getDate()
    )
    if (events[0].allDay) {
      dayToUse = new Date(
        startDay.getUTCFullYear(),
        startDay.getUTCMonth(),
        startDay.getUTCDate()
      )
    }

    return (
      <div className='calendar-events-group' key={'g' + dayTimestamp}>
        <span className='event-day-header'>{dayToUse.toDateString()}</span>
        <span className='calendar-events'>
          {renderEvents(events as Event[])}
        </span>
      </div>
    )
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
        {events && events.length > 0 ? renderEvents(events) : ''}
      </div>
    )
  }

  const renderDayListWithDaySelector = () => {
    return (
      <div className='calendar-list-container'>
        <div className='day-selector'>
          <button onClick={() => fetchDay(addDays(startTime, -1))}>&lt;</button>
          {startTime.toDateString()}
          <button onClick={() => fetchDay(addDays(startTime, 1))}>&gt;</button>
        </div>
        {!events || !events.length ? (
          <span className='no-events'>No events scheduled for today</span>
        ) : (
          ''
        )}
        {events && events.length > 0 ? renderEvents(events) : ''}
      </div>
    )
  }

  const renderDayList = () => {
    return (
      <div className='calendar-list-container'>
        {!events || !events.length ? (
          <span className='no-events'>No events scheduled for today</span>
        ) : (
          ''
        )}
        {events && events.length > 0 ? renderEvents(events) : ''}
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
        {events && events.length > 0 ? renderEventsByDay(events) : ''}
      </div>
    )
  }

  const renderView = () => {
    if (!viewAs || viewAs === ViewType.List) return renderList()
    if (viewAs === ViewType.CalendarView) return renderCalendarView()
    if (viewAs === ViewType.DayList) return renderDayListWithDaySelector()
    if (viewAs === ViewType.DayView) return renderDayList()
    if (viewAs === ViewType.DayViewByLocation) return renderCalendarByLocation()
    return renderList()
  }

  return <div className='airjam-calendar-view'>{renderView()}</div>
}
