import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  project: '#384E84',
  estimation: '#7A7A79',
  welding: '#384E84',
  painting: '#7A7A79',
  woodwork: '#212121',
  upholstery: '#5A6A8A',
};

const GanttCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysToShow, setDaysToShow] = useState(30);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, [currentDate, daysToShow]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/orders`);
      // Получаем все заказы со стадиями
      const ordersWithStages = response.data.filter(order => 
        order.stages && order.stages.length > 0 && 
        order.stages.some(s => s.start_date && s.end_date)
      );
      setOrders(ordersWithStages);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 5);
    return start;
  };

  const getDates = () => {
    const dates = [];
    const start = getStartDate();
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = getDates();
  const startDate = getStartDate();
  const dayWidth = 40;

  const getBarPosition = (stageStart, stageEnd) => {
    const start = new Date(stageStart);
    const end = new Date(stageEnd);
    
    const diffStart = Math.floor((start - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      left: diffStart * dayWidth,
      width: Math.max(duration * dayWidth - 4, dayWidth - 4),
    };
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - Math.floor(daysToShow / 2));
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + Math.floor(daysToShow / 2));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const zoomIn = () => {
    setDaysToShow(Math.max(14, daysToShow - 7));
  };

  const zoomOut = () => {
    setDaysToShow(Math.min(60, daysToShow + 7));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">График производства</h1>
        <p className="text-gray-900">Диаграмма Ганта — планирование этапов и контроль загрузки</p>
      </div>

      <Card className="p-4 mb-6 border-gray-300 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousPeriod} data-testid="prev-period-btn">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Сегодня
            </Button>
            <Button variant="outline" size="sm" onClick={nextPeriod} data-testid="next-period-btn">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-lg font-semibold text-gray-900">
            {dates[0]?.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomIn} data-testid="zoom-in-btn">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut} data-testid="zoom-out-btn">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-gray-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex">
            {/* Left sidebar - Order names */}
            <div className="w-64 flex-shrink-0 border-r border-gray-300 bg-gray-50">
              <div className="h-16 border-b border-gray-300 flex items-center px-4 font-semibold text-gray-900 bg-gray-100">
                Заказы / Этапы
              </div>
              {orders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Нет заказов с этапами
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id}>
                    <div 
                      className="h-12 border-b border-gray-200 flex items-center px-4 font-medium text-gray-900 bg-white cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <span className="truncate" title={order.name}>{order.name}</span>
                    </div>
                    {order.stages?.filter(s => s.start_date && s.end_date).map((stage) => (
                      <div 
                        key={stage.id} 
                        className="h-10 border-b border-gray-100 flex items-center px-4 pl-8 text-sm text-gray-600 bg-gray-50"
                      >
                        {stageTypeLabels[stage.type]}
                        {stage.master && <span className="ml-2 text-xs text-gray-400">({stage.master})</span>}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Right side - Gantt chart */}
            <div className="flex-1 overflow-x-auto" ref={containerRef}>
              <div style={{ width: dates.length * dayWidth, minWidth: '100%' }}>
                {/* Header with dates */}
                <div className="h-16 border-b border-gray-300 flex bg-gray-100">
                  {dates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-200 ${
                        isToday(date) ? 'bg-[#384E84]/10' : isWeekend(date) ? 'bg-gray-50' : ''
                      }`}
                      style={{ width: dayWidth }}
                    >
                      <span className={`text-xs ${isToday(date) ? 'text-[#384E84] font-bold' : 'text-gray-500'}`}>
                        {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </span>
                      <span className={`text-sm font-medium ${isToday(date) ? 'text-[#384E84]' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Gantt rows */}
                {orders.map((order) => (
                  <div key={order.id}>
                    {/* Order row */}
                    <div className="h-12 border-b border-gray-200 relative flex">
                      {dates.map((date, index) => (
                        <div
                          key={index}
                          className={`flex-shrink-0 border-r border-gray-100 ${
                            isToday(date) ? 'bg-[#384E84]/5' : isWeekend(date) ? 'bg-gray-50/50' : ''
                          }`}
                          style={{ width: dayWidth }}
                        />
                      ))}
                    </div>
                    
                    {/* Stage rows */}
                    {order.stages?.filter(s => s.start_date && s.end_date).map((stage) => {
                      const position = getBarPosition(stage.start_date, stage.end_date);
                      return (
                        <div key={stage.id} className="h-10 border-b border-gray-100 relative flex">
                          {dates.map((date, index) => (
                            <div
                              key={index}
                              className={`flex-shrink-0 border-r border-gray-100 ${
                                isToday(date) ? 'bg-[#384E84]/5' : isWeekend(date) ? 'bg-gray-50/50' : ''
                              }`}
                              style={{ width: dayWidth }}
                            />
                          ))}
                          
                          {/* Gantt bar */}
                          {position.left >= -dayWidth * 5 && position.left < dates.length * dayWidth && (
                            <div
                              className="absolute top-1 h-8 rounded-sm flex items-center px-2 text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                left: Math.max(0, position.left),
                                width: position.width,
                                backgroundColor: stageTypeColors[stage.type],
                              }}
                              title={`${stageTypeLabels[stage.type]}: ${new Date(stage.start_date).toLocaleDateString('ru-RU')} - ${new Date(stage.end_date).toLocaleDateString('ru-RU')}`}
                            >
                              <span className="truncate">{stageTypeLabels[stage.type]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="mt-6 p-6 border-gray-300 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Легенда этапов</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stageTypeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: stageTypeColors[key] }}
              />
              <span className="text-sm text-gray-900">{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GanttCalendar;
