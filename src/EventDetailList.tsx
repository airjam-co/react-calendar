import React from 'react';
import { CalendarEvent } from '@airjam/types';
import { EventDetail } from './EventDetail';

interface Props {
  events: CalendarEvent[];
  descriptionLength?: number;
  renderEventFunc?: (event: CalendarEvent, index: number) => React.JSX.Element
}

export const EventDetailList = ({ events, descriptionLength, renderEventFunc }: Props) => {
  React.useEffect(() => {});

  const renderEvents = () => {
    return (
      <span className='calendar-events'>
        {events.map(function (e, idx) {
          if (renderEventFunc) return renderEventFunc(e, idx)
          return <EventDetail idx={idx} event={e} descriptionLength={descriptionLength} />
        })}
      </span>
    )
  }

  return renderEvents();
};
