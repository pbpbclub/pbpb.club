import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Package, Clock, CheckCircle, Play, Pause, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

const stageStatusLabels = {
  not_started: 'Не начат',
  in_progress: 'В работе',
  completed: 'Завершен',
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

  // Group stages by status for Kanban columns
  const getStagesByStatus = () => {
    const statusMap = {
      not_started: [],
      in_progress: [],
      completed: [],
    };

    orders.forEach(order => {
      if (order.stages) {
        order.stages.forEach(stage => {
          if (statusMap[stage.status]) {
            statusMap[stage.status].push({
              ...stage,
              orderName: order.name,
              orderId: order.id,
              clientName: order.client,
            });
          }
        });
      }
    });

    return statusMap;
  };

  const [stagesByStatus, setStagesByStatus] = useState({ not_started: [], in_progress: [], completed: [] });

  useEffect(() => {
    setStagesByStatus(getStagesByStatus());
  }, [orders]);

  // Handle drag end
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Find the stage and its order
    const [orderId, stageId] = draggableId.split('__');
    const newStatus = destination.droppableId;

    // Optimistic update
    const newStagesByStatus = { ...stagesByStatus };
    const sourceItems = [...newStagesByStatus[source.droppableId]];
    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = newStatus;
    
    const destItems = source.droppableId === destination.droppableId 
      ? sourceItems 
      : [...newStagesByStatus[destination.droppableId]];
    destItems.splice(destination.index, 0, movedItem);

    newStagesByStatus[source.droppableId] = sourceItems;
    newStagesByStatus[destination.droppableId] = destItems;
    setStagesByStatus(newStagesByStatus);

    // API call to update stage status
    try {
      await axios.put(`${API}/orders/${orderId}/stages/${stageId}/status?status=${newStatus}`);
      // Refresh to get updated data
      fetchOrders();
    } catch (error) {
      console.error('Error updating stage status:', error);
      // Revert on error
      fetchOrders();
    }
  };

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

  const columns = [
    { id: 'not_started', label: 'Не начат', color: '#DCDCDC', bgColor: 'bg-gray-50' },
    { id: 'in_progress', label: 'В работе', color: '#384E84', bgColor: 'bg-blue-50' },
    { id: 'completed', label: 'Завершен', color: '#22c55e', bgColor: 'bg-green-50' },
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
          <p className="text-[#7A7A79]">Перетаскивайте карточки для изменения статуса</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {columns.map(col => (
            <div key={col.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }}></div>
              <span className="text-[#7A7A79]">{col.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }}></div>
                  <h3 className="font-semibold text-[#212121]">{column.label}</h3>
                </div>
                <Badge className="bg-gray-100 text-[#7A7A79] border-gray-200">
                  {stagesByStatus[column.id]?.length || 0}
                </Badge>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-lg p-2 min-h-[500px] space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-100 border-2 border-dashed border-[#384E84]' : column.bgColor
                    }`}
                  >
                    {stagesByStatus[column.id]?.length === 0 ? (
                      <div className="text-center py-8 text-[#7A7A79] text-sm">
                        {snapshot.isDraggingOver ? 'Отпустите здесь' : 'Нет этапов'}
                      </div>
                    ) : (
                      stagesByStatus[column.id]?.map((stage, index) => (
                        <Draggable
                          key={`${stage.orderId}__${stage.id}`}
                          draggableId={`${stage.orderId}__${stage.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`cursor-grab active:cursor-grabbing transition-shadow border-l-4 ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                borderLeftColor: column.color,
                              }}
                              onClick={() => !snapshot.isDragging && navigate(`/orders/${stage.orderId}`)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="mr-2 text-[#7A7A79] hover:text-[#384E84]">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-[#212121] text-sm truncate">
                                      {stage.orderName}
                                    </h4>
                                    <p className="text-xs text-[#7A7A79] truncate">
                                      {stage.clientName}
                                    </p>
                                  </div>
                                  <Badge className="text-xs ml-2" variant="outline">
                                    {stageTypeLabels[stage.type]}
                                  </Badge>
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
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-[#DCDCDC] mb-4" />
          <h3 className="text-lg font-medium text-[#212121] mb-2">Нет активных заказов</h3>
          <p className="text-[#7A7A79]">Создайте заказ и добавьте производственные этапы</p>
        </div>
      )}
    </div>
  );
};

export default Production;
