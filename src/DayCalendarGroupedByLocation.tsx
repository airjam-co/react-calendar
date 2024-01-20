import React from 'react';
import {
  BookableEvent,
  CalendarEvent,
  HOUR_ONLY,
  minutesSinceMidnight,
} from '@airjam/types';
import { EventDetail } from './EventDetail';

interface Props {
  events: CalendarEvent[] | BookableEvent[];
  descriptionLength?: number;
  renderEventFunc?: (event: CalendarEvent, index: number) => React.JSX.Element
}

export const DayCalendarGroupedByLocation = ({ events, descriptionLength, renderEventFunc }: Props) => {
  React.useEffect(() => {});

    const renderDayCalendarByLocation = () => {
    if (!events || !events.length)
      return (
        <div className='calendar-list-container'>
          <span className='no-events'>No events found</span>
        </div>
      )

    let earliestStartTime: Date | undefined = undefined;
    let latestEndTime: Date | undefined = undefined;
    const eventsByLocations: Map<String, CalendarEvent[]> = new Map<String, CalendarEvent[]>()
    for (let i = 0; i < events.length; i++) {
      const location = events[i].location ? events[i].location : ''
      if (events[i].startTimeUtc && !events[i].isAllDay) {
        const start = new Date(events[i].startTimeUtc)
        if (start > new Date(0)) {
          if ((!earliestStartTime) || (start < earliestStartTime)) {
            earliestStartTime = start
          }
        }
      }
      if (events[i].endTimeUtc && !events[i].isAllDay) {
        const end = new Date(events[i].endTimeUtc)
        if (end > new Date(0)) {
          if ((!latestEndTime) || (end > latestEndTime)) {
            latestEndTime = end
          }
        }
      }
      let locationEvents: CalendarEvent[] = []
      if (eventsByLocations.has(location))
        locationEvents = eventsByLocations.get(location)!
      locationEvents.push(events[i])
      eventsByLocations.set(location, locationEvents)
    }
    const uniqueLocations: String[] = []
    for (const entry of Array.from(eventsByLocations.entries())) {
      const key = entry[0]
      uniqueLocations.push(key)
    }
    uniqueLocations.sort()
    const earliestStartHour: number = earliestStartTime ? earliestStartTime.getHours() : 0
    const latestEndHour: number = latestEndTime ? latestEndTime.getHours() : 23
    const someArrayWith24Elements = ['','','','','','','','','','','','','','','','','','','','','','','','']
    const someArrayForMapLoop = someArrayWith24Elements.slice(earliestStartHour, latestEndHour + 1)
    const numScheduleStopsInMinutes: number = (latestEndHour - earliestStartHour + 1) * 60
    return (
      <div className='calendar-location-list-container'>
        <div className='grid-timeline' style={{gridTemplateRows: 'repeat(' + (numScheduleStopsInMinutes / 60) + ', 60px)'}}>
          <div className='grid-spacer'></div>
          {
            someArrayForMapLoop.map(function (key, idx) {
              let timeMarkerRenderDate = new Date()
              timeMarkerRenderDate.setHours(idx + earliestStartHour)
              return <div key={'time-marker-' + idx + key} className='time-marker'>
                  {timeMarkerRenderDate.toLocaleTimeString([], HOUR_ONLY)}
                </div>
            })
          }
        </div>
        <div className='schedule-entries'>
          {uniqueLocations.map(function (key, idx) {
            if (!eventsByLocations.has(key)) return <div key={'location' + idx}></div>
            return (
              <div key={'location' + idx} className='calendar-location-container'>
                <div className='location-header'>
                  {key}
                  {renderGridAllDayEvents(eventsByLocations.get(key)!)}
                </div>
                {renderGridTimedEvents(eventsByLocations.get(key)!, earliestStartHour, numScheduleStopsInMinutes)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderGridAllDayEvents = (events: CalendarEvent[]) => {
    return (
      <div className='all-day-events'>
        {events.filter(e => e.isAllDay).map(function (e, idx) {
          const renderedEvent: React.JSX.Element = renderEventFunc ?
            renderEventFunc(e, idx) :
            <EventDetail idx={idx} event={e} descriptionLength={descriptionLength} />
          return (
            <div className='schedule-event-container' key={'all-day-events-' + idx}>
              {renderedEvent}
            </div>
          )
        })}
      </div>
    )
  }

  const renderGridTimedEvents = (events: CalendarEvent[], earliestStartHour: number, numScheduleStopsInMinutes: number) => {
    const earliestStartMinute = earliestStartHour * 60
    return (
      <div className='schedule-events' style={{gridTemplateRows: 'repeat(' + numScheduleStopsInMinutes + ', 1px)'}}>
        {events.filter(e => (e.startTimeUtc && e.endTimeUtc && !e.isAllDay)).map(function (e, idx) {
          const renderedEvent: React.JSX.Element = renderEventFunc ?
            renderEventFunc(e, idx) :
            <EventDetail idx={idx} event={e} descriptionLength={descriptionLength} />
          const startTimeMinute = minutesSinceMidnight(e.startTimeUtc) - earliestStartMinute
          const endTimeMinute = minutesSinceMidnight(e.endTimeUtc) - earliestStartMinute
          return (
            <div
              className='schedule-event-container' 
              style={{gridRowStart: startTimeMinute, gridRowEnd: endTimeMinute}}
              key={'schedule-events-container-' + idx}>
              {renderedEvent}
            </div>
          )
        })}
      </div>
    )
  }

  return renderDayCalendarByLocation();
};
