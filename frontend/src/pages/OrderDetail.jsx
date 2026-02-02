import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const stageStatusColors = {
  not_started: 'bg-gray-200 text-[#212121]',
  in_progress: 'bg-[#384E84] text-white',
  completed: 'bg-[#7A7A79] text-white',
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState({});
  const [openStageDialog, setOpenStageDialog] = useState(false);
  const [openCostDialog, setOpenCostDialog] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [newStage, setNewStage] = useState({
    type: 'welding',
    status: 'not_started',
    start_date: '',
    end_date: '',
    master: '',
    notes: '',
  });
  const [newCost, setNewCost] = useState({
    name: '',
    quantity: 0,
    unit: 'ч',
    price_per_unit: 500,
  });

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      // Expand all stages by default
      const expanded = {};
      response.data.stages.forEach(s => { expanded[s.id] = true; });
      setExpandedStages(expanded);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStage = async () => {
    try {
      await axios.post(`${API}/orders/${orderId}/stages`, newStage);
      setOpenStageDialog(false);
      setNewStage({ type: 'welding', status: 'not_started', start_date: '', end_date: '', master: '', notes: '' });
      fetchOrder();
    } catch (error) {
      console.error('Error adding stage:', error);
    }
  };

  const addCostItem = async () => {
    if (!selectedStageId) return;
    try {
      await axios.post(`${API}/orders/${orderId}/stages/${selectedStageId}/costs`, newCost);
      setOpenCostDialog(false);
      setSelectedStageId(null);
      setNewCost({ name: '', quantity: 0, unit: 'ч', price_per_unit: 500 });
      fetchOrder();
    } catch (error) {
      console.error('Error adding cost item:', error);
    }
  };

  const toggleStage = (stageId) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value) + ' ₽';
  };

  const calculateTotalHours = () => {
    if (!order) return 0;
    return order.stages.reduce((sum, stage) => {
      return sum + (stage.cost_items || []).reduce((itemSum, item) => {
        return item.unit === 'ч' ? itemSum + item.quantity : itemSum;
      }, 0);
    }, 0);
  };

  const calculateMargin = () => {
    if (!order || order.actual_cost === 0) return { amount: 0, percent: 0 };
    const margin = order.cash_price - order.actual_cost;
    const percent = (margin / order.actual_cost) * 100;
    return { amount: margin, percent };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384E84]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <p className="text-[#7A7A79]">Заказ не найден</p>
      </div>
    );
  }

  const margin = calculateMargin();

  return (
    <div className="p-8">
      {/* Breadcrumbs */}
      <div className="text-sm text-[#7A7A79] mb-4">
        <span className="cursor-pointer hover:text-[#384E84]" onClick={() => navigate('/orders')}>Заказы</span>
        {' / '}
        <span className="text-[#212121]">{order.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] mb-1">{order.name}</h1>
          <p className="text-[#7A7A79]">Клиент: {order.client}</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="gap-2 text-[#7A7A79]"
          data-testid="back-to-orders-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          К списку
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase tracking-wider mb-1">Себестоимость</div>
            <div className="text-2xl font-bold text-[#212121]">{formatCurrency(order.actual_cost)}</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase tracking-wider mb-1">Цена наличными</div>
            <div className="text-2xl font-bold text-[#384E84]">{formatCurrency(order.cash_price)}</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase tracking-wider mb-1">Цена безналичными</div>
            <div className="text-2xl font-bold text-[#7A7A79]">{formatCurrency(order.cashless_price)}</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC] bg-gray-50">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase tracking-wider mb-1">Маржа</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">+{formatCurrency(margin.amount)}</span>
              <span className="text-lg font-medium text-green-600">+{margin.percent.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Stages Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Производственные этапы</h2>
          <p className="text-sm text-[#7A7A79]">Детализация работ, времени и стоимости</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-[#7A7A79]">ВСЕГО ЧАСОВ</div>
            <div className="text-xl font-bold text-[#212121]">{calculateTotalHours()} ч</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#7A7A79]">ОБЩАЯ СТОИМОСТЬ</div>
            <div className="text-xl font-bold text-[#384E84]">{formatCurrency(order.actual_cost)}</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-50 rounded p-3 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[#7A7A79]">Прогресс выполнения</span>
          <span className="text-[#7A7A79]">
            {order.stages.filter(s => s.status === 'completed').length} из {order.stages.length} этапов
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded">
          <div 
            className="h-full bg-[#384E84] rounded transition-all duration-300"
            style={{ 
              width: order.stages.length > 0 
                ? `${(order.stages.filter(s => s.status === 'completed').length / order.stages.length) * 100}%` 
                : '0%' 
            }}
          />
        </div>
      </div>

      {/* Stages List */}
      <div className="space-y-4 mb-6">
        {order.stages.length === 0 ? (
          <Card className="border-[#DCDCDC]">
            <CardContent className="p-12 text-center text-[#7A7A79]">
              Этапов пока нет. Добавьте первый этап производства.
            </CardContent>
          </Card>
        ) : (
          order.stages.map((stage) => (
            <Card key={stage.id} className="border-[#DCDCDC] overflow-hidden">
              {/* Stage Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleStage(stage.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                    ${stage.status === 'completed' ? 'bg-[#7A7A79]' : 
                      stage.status === 'in_progress' ? 'bg-[#384E84]' : 'bg-gray-300'}`}
                  >
                    {stage.status === 'completed' ? '✓' : stageTypeLabels[stage.type]?.[0] || 'С'}
                  </div>
                  <div>
                    <div className="font-semibold text-[#212121]">{stageTypeLabels[stage.type] || stage.type}</div>
                    <div className="text-sm text-[#7A7A79]">
                      {(stage.cost_items || []).length} позиций
                      {stage.master && ` • Мастер: ${stage.master}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={stageStatusColors[stage.status]}>
                    {stageStatusLabels[stage.status]}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm text-[#7A7A79]">
                      Итого: {(stage.cost_items || []).reduce((sum, item) => item.unit === 'ч' ? sum + item.quantity : sum, 0)} ч
                    </div>
                    <div className="font-bold text-[#212121]">{formatCurrency(stage.total_cost || 0)}</div>
                  </div>
                  {expandedStages[stage.id] ? (
                    <ChevronUp className="w-5 h-5 text-[#7A7A79]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#7A7A79]" />
                  )}
                </div>
              </div>

              {/* Stage Content - Expandable */}
              {expandedStages[stage.id] && (
                <div className="border-t border-[#DCDCDC] p-4 bg-gray-50">
                  {stage.cost_items && stage.cost_items.length > 0 ? (
                    <table className="w-full text-sm mb-4">
                      <thead>
                        <tr className="border-b border-[#DCDCDC]">
                          <th className="pb-2 text-left font-medium text-[#7A7A79] uppercase text-xs">Тип работ</th>
                          <th className="pb-2 text-right font-medium text-[#7A7A79] uppercase text-xs w-24">Кол-во</th>
                          <th className="pb-2 text-right font-medium text-[#7A7A79] uppercase text-xs w-32">Ставка</th>
                          <th className="pb-2 text-right font-medium text-[#7A7A79] uppercase text-xs w-32">Стоимость</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage.cost_items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="py-3 text-[#212121]">{item.name}</td>
                            <td className="py-3 text-right text-[#7A7A79]">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 text-right text-[#7A7A79]">
                              {formatCurrency(item.price_per_unit)}/{item.unit}
                            </td>
                            <td className="py-3 text-right font-medium text-[#212121]">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 text-[#7A7A79]">
                      Работы не добавлены
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStageId(stage.id);
                      setOpenCostDialog(true);
                    }}
                    className="text-[#384E84] gap-1"
                    data-testid={`add-cost-${stage.id}`}
                  >
                    <Plus className="w-4 h-4" />
                    Добавить работу
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add Stage Button */}
      <div 
        className="border-2 border-dashed border-[#DCDCDC] rounded-lg p-6 text-center cursor-pointer hover:border-[#384E84] transition-colors"
        onClick={() => setOpenStageDialog(true)}
        data-testid="add-stage-btn"
      >
        <Plus className="w-6 h-6 mx-auto mb-2 text-[#7A7A79]" />
        <span className="text-[#7A7A79]">Добавить производственный этап</span>
      </div>

      {/* Add Stage Dialog */}
      <Dialog open={openStageDialog} onOpenChange={setOpenStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Новый этап</DialogTitle>
            <DialogDescription>
              Добавьте этап производства для этого заказа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#212121]">Тип этапа</Label>
              <Select value={newStage.type} onValueChange={(value) => setNewStage({ ...newStage, type: value })}>
                <SelectTrigger className="border-[#DCDCDC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stageTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#212121]">Мастер</Label>
              <Input
                value={newStage.master}
                onChange={(e) => setNewStage({ ...newStage, master: e.target.value })}
                placeholder="Имя мастера"
                className="border-[#DCDCDC]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#212121]">Дата начала</Label>
                <Input
                  type="date"
                  value={newStage.start_date}
                  onChange={(e) => setNewStage({ ...newStage, start_date: e.target.value })}
                  className="border-[#DCDCDC]"
                />
              </div>
              <div>
                <Label className="text-[#212121]">Дата окончания</Label>
                <Input
                  type="date"
                  value={newStage.end_date}
                  onChange={(e) => setNewStage({ ...newStage, end_date: e.target.value })}
                  className="border-[#DCDCDC]"
                />
              </div>
            </div>
            <Button 
              onClick={addStage} 
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              data-testid="submit-stage-btn"
            >
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={openCostDialog} onOpenChange={setOpenCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Добавить работу</DialogTitle>
            <DialogDescription>
              Укажите работу или материал для этого этапа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#212121]">Название</Label>
              <Input
                value={newCost.name}
                onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                placeholder="Например: Сварочные работы"
                className="border-[#DCDCDC]"
                data-testid="cost-name-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#212121]">Количество</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newCost.quantity}
                  onChange={(e) => setNewCost({ ...newCost, quantity: parseFloat(e.target.value) || 0 })}
                  className="border-[#DCDCDC]"
                  data-testid="cost-qty-input"
                />
              </div>
              <div>
                <Label className="text-[#212121]">Единица</Label>
                <Select value={newCost.unit} onValueChange={(value) => setNewCost({ ...newCost, unit: value })}>
                  <SelectTrigger className="border-[#DCDCDC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ч">ч (часы)</SelectItem>
                    <SelectItem value="шт">шт</SelectItem>
                    <SelectItem value="м">м</SelectItem>
                    <SelectItem value="кг">кг</SelectItem>
                    <SelectItem value="м2">м²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#212121]">Ставка (₽/{newCost.unit})</Label>
                <Input
                  type="number"
                  value={newCost.price_per_unit}
                  onChange={(e) => setNewCost({ ...newCost, price_per_unit: parseFloat(e.target.value) || 0 })}
                  className="border-[#DCDCDC]"
                  data-testid="cost-rate-input"
                />
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 flex justify-between items-center">
              <span className="text-[#7A7A79]">Итого:</span>
              <span className="text-xl font-bold text-[#212121]">
                {formatCurrency(newCost.quantity * newCost.price_per_unit)}
              </span>
            </div>
            <Button 
              onClick={addCostItem} 
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              disabled={!newCost.name || newCost.quantity <= 0}
              data-testid="submit-cost-btn"
            >
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;
