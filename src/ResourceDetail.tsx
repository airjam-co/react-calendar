import React from 'react';
import {
  CalendarResource,
  DEFAULT_DESCRIPTION_LENGTH_CUTOFF,
} from '@airjam/types';

interface Props {
  resource: CalendarResource;
  descriptionLength?: number;
  onPress?: (id: string) => void;
}

export const ResourceDetail = ({ resource, descriptionLength, onPress }: Props) => {
  React.useEffect(() => {});

  const renderResource = () => {
    let description = resource.description ? resource.description : ''
    const descLimit = descriptionLength || DEFAULT_DESCRIPTION_LENGTH_CUTOFF
    if (descLimit > 2 && description.length > descLimit)
      description = description.substring(0, descLimit - 3) + '...'
    return (
      <div key={'e-' + resource._id} className='event-block' onClick={() => {
        if (onPress) onPress(resource._id);
      }}>
        <span className='time-block'>no time</span>
        <span className='description-block'>
          <span className='title'>{resource.name}</span>
          <span className='description'>{description}</span>
        </span>
      </div>
    )
  }

  return renderResource();
};
