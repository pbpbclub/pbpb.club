import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const stageTypeLabels = {
  project: 'Проект',
  estimation: 'Смета',
  welding: 'Сварка',
  painting: 'Покраска',
  woodwork: 'Дерево',
  upholstery: 'Мягкая мебель',
};

const stageTypeColors = {
  project: 'bg-[#384E84]',
  estimation: 'bg-[#7A7A79]',
  welding: 'bg-[#384E84]',
  painting: 'bg-[#7A7A79]',
  woodwork: 'bg-[#212121]',
  upholstery: 'bg-[#7A7A79]',
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await axios.get(`${API}/calendar`, {
        params: {
          start_date: startOfMonth.toISOString(),
          end_date: endOfMonth.toISOString(),
        },
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      date
    ).toISOString().split('T')[0];

    return events.filter(event => {
      const eventStart = new Date(event.start).toISOString().split('T')[0];
      const eventEnd = new Date(event.end).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Производственный календарь</h1>
        <p className="text-gray-900">Планирование этапов и контроль загрузки</p>
      </div>

      <Card className="p-6 border-gray-300 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold capitalize text-gray-900">{monthName}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
              data-testid="prev-month-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              data-testid="next-month-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-semibold text-gray-900 py-2"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: (startingDayOfWeek + 6) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px]" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((date) => {
              const dayEvents = getEventsForDate(date);
              const today = new Date();
              const isToday =
                today.getDate() === date &&
                today.getMonth() === currentDate.getMonth() &&
                today.getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={date}
                  data-testid={`calendar-day-${date}`}
                  className={`min-h-[120px] p-2 border rounded transition-colors ${
                    isToday ? 'bg-[#384E84]/10 border-[#384E84] shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      isToday ? 'text-[#384E84]' : 'text-gray-900'
                    }`}
                  >
                    {date}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded-sm text-white truncate ${
                          stageTypeColors[event.stage_type]
                        }`}
                        title={`${event.order_name} - ${stageTypeLabels[event.stage_type]}${event.master ? ` (${event.master})` : ''}`}
                      >
                        {event.order_name.substring(0, 15)}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-900 text-center">
                        +{dayEvents.length - 3} ещё
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6 border-gray-300 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Легенда этапов</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stageTypeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm ${stageTypeColors[key]}`} />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Calendar;