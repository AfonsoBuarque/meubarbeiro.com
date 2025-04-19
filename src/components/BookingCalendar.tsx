import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
};

interface BookingCalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ events = [], onDateClick, onEventClick }) => {
  const calendarRef = useRef<FullCalendar | null>(null);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale={ptBrLocale}
        height={600}
        events={events}
        dateClick={info => onDateClick && onDateClick(info.date)}
        eventClick={info => onEventClick && onEventClick(info.event.id)}
        selectable={true}
        editable={false}
        eventColor="#2563eb"
      />
    </div>
  );
};

export default BookingCalendar;
