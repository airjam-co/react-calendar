import React from 'react';
import {
  BookableEvent,
  CalendarEvent,
} from '@airjam/types';
import { EventDetailList } from './EventDetailList';

interface Props {
  events: CalendarEvent[] | BookableEvent[];
  descriptionLength?: number;
  renderEventFunc?: (event: CalendarEvent, index: number) => React.JSX.Element
}

export const EventListGroupedByDay = ({ events, descriptionLength, renderEventFunc }: Props) => {
  React.useEffect(() => {});

  const renderEventsByDay = () => {
    const eventByDays: Map<number, CalendarEvent[]> = new Map<number, CalendarEvent[]>()
    for (let i = 0; i < events.length; i++) {
      if (events[i].startTimeUtc) {
        const startDate = new Date(events[i].startTimeUtc)
        let dayToUse = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )
        if (events[i].isAllDay) {
          dayToUse = new Date(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate()
          )
        }
        const dayIdx = dayToUse.getTime() / 1000

        let dayEvents: CalendarEvent[] = []
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
    events: CalendarEvent[] | undefined,
    dayTimestamp: number
  ) => {
    if (!events || !events.length || !events[0].startTimeUtc) return ''
    const startDay = new Date(events[0].startTimeUtc)
    let dayToUse = new Date(
      startDay.getFullYear(),
      startDay.getMonth(),
      startDay.getDate()
    )
    if (events[0].isAllDay) {
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
          <EventDetailList
            events={events as CalendarEvent[]}
            descriptionLength={descriptionLength}
            renderEventFunc={renderEventFunc} />
        </span>
      </div>
    )
  }

  return renderEventsByDay();
};
