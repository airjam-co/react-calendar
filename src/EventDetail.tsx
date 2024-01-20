import React from 'react';
import {
  BookableEvent,
  CalendarEvent,
  DEFAULT_DESCRIPTION_LENGTH_CUTOFF,
  getEventTime,
} from '@airjam/types';

interface Props {
  idx: number;
  event: CalendarEvent | BookableEvent;
  descriptionLength?: number;
}

export const EventDetail = ({ idx, event, descriptionLength }: Props) => {
  React.useEffect(() => {});

  const renderEvent = () => {
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

  return renderEvent();
};
