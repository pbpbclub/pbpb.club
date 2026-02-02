import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Clock, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const stageTypeLabels = {
  project: 'Проект',
  estimation: 'Смета',
  welding: 'Сварка',
  painting: 'Покраска',
  woodwork: 'Столярка',
  upholstery: 'Обивка',
};

const Production = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      // Filter only active orders
      const activeOrders = response.data.filter(o => 
        ['project', 'estimation', 'production'].includes(o.status)
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group stages by type
  const getStagesByType = () => {
    const stageMap = {
      project: [],
      estimation: [],
      welding: [],
      painting: [],
      woodwork: [],
      upholstery: [],
    };

    orders.forEach(order => {
      if (order.stages) {
        order.stages.forEach(stage => {
          if (stageMap[stage.type]) {
            stageMap[stage.type].push({
              ...stage,
              orderName: order.name,
              orderId: order.id,
              clientName: order.client,
            });
          }
        });
      }
    });

    return stageMap;
  };

  const stagesByType = getStagesByType();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-[#384E84]" />;
      default:
        return <Pause className="w-4 h-4 text-[#7A7A79]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-600';
      case 'in_progress':
        return 'border-l-[#384E84]';
      default:
        return 'border-l-[#DCDCDC]';
    }
  };

  const columns = [
    { type: 'project', label: 'Проект', icon: Package, color: '#7A7A79' },
    { type: 'estimation', label: 'Смета', icon: Clock, color: '#7A7A79' },
    { type: 'welding', label: 'Сварка', icon: AlertCircle, color: '#E26A2D' },
    { type: 'painting', label: 'Покраска', icon: AlertCircle, color: '#384E84' },
    { type: 'woodwork', label: 'Столярка', icon: AlertCircle, color: '#8B4513' },
    { type: 'upholstery', label: 'Обивка', icon: AlertCircle, color: '#6B7280' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384E84]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: 'Производство' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] mb-1">Производство</h1>
          <p className="text-[#7A7A79]">Доска производственных этапов</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#DCDCDC]"></div>
            <span className="text-[#7A7A79]">Не начат</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#384E84]"></div>
            <span className="text-[#7A7A79]">В работе</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-[#7A7A79]">Завершен</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div 
            key={column.type}
            className="flex-shrink-0 w-72"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                ></div>
                <h3 className="font-semibold text-[#212121]">{column.label}</h3>
              </div>
              <Badge className="bg-gray-100 text-[#7A7A79] border-gray-200">
                {stagesByType[column.type]?.length || 0}
              </Badge>
            </div>

            {/* Column Content */}
            <div className="bg-gray-50 rounded-lg p-2 min-h-[500px] space-y-2">
              {stagesByType[column.type]?.length === 0 ? (
                <div className="text-center py-8 text-[#7A7A79] text-sm">
                  Нет этапов
                </div>
              ) : (
                stagesByType[column.type]?.map((stage, index) => (
                  <Card 
                    key={`${stage.orderId}-${stage.id || index}`}
                    className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getStatusColor(stage.status)}`}
                    onClick={() => navigate(`/orders/${stage.orderId}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[#212121] text-sm truncate">
                            {stage.orderName}
                          </h4>
                          <p className="text-xs text-[#7A7A79] truncate">
                            {stage.clientName}
                          </p>
                        </div>
                        {getStatusIcon(stage.status)}
                      </div>
                      
                      {stage.master && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-5 h-5 rounded-full bg-[#384E84] text-white text-xs flex items-center justify-center">
                            {stage.master.charAt(0)}
                          </div>
                          <span className="text-xs text-[#7A7A79]">{stage.master}</span>
                        </div>
                      )}

                      {stage.total_cost > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs text-[#7A7A79]">Стоимость: </span>
                          <span className="text-xs font-medium text-[#212121]">
                            {new Intl.NumberFormat('ru-RU').format(stage.total_cost)} ₽
                          </span>
                        </div>
                      )}

                      {(stage.start_date || stage.end_date) && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-[#7A7A79]">
                          <Clock className="w-3 h-3" />
                          {stage.start_date && new Date(stage.start_date).toLocaleDateString('ru-RU')}
                          {stage.end_date && ` — ${new Date(stage.end_date).toLocaleDateString('ru-RU')}`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Всего заказов</div>
            <div className="text-2xl font-bold text-[#212121]">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Активных этапов</div>
            <div className="text-2xl font-bold text-[#384E84]">
              {Object.values(stagesByType).flat().filter(s => s.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Ожидают запуска</div>
            <div className="text-2xl font-bold text-[#E26A2D]">
              {Object.values(stagesByType).flat().filter(s => s.status === 'not_started').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Завершено</div>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(stagesByType).flat().filter(s => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Production;
