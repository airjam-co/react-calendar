import { CalendarEvent } from "@airjam/types"
import { CalendarViewType as ViewType } from '@airjam/types';

export interface Props {
  id: string
  authToken?: string
  host?: string
  location?: string
  showDate?: Date
  showEndDate?: Date
  viewAs?: ViewType
  descriptionLength?: number
  renderEventFunc?: (event: CalendarEvent, index: number) => React.JSX.Element
}
