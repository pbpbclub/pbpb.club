import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

const stageStatusLabels = {
  not_started: 'Не начат',
  in_progress: 'В работе',
  completed: 'Завершен',
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
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
    unit: 'шт',
    price_per_unit: 0,
  });

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
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
      setNewCost({ name: '', quantity: 0, unit: 'шт', price_per_unit: 0 });
      fetchOrder();
    } catch (error) {
      console.error('Error adding cost item:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <p>Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/orders')}
        className="mb-6 gap-2"
        data-testid="back-to-orders-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к заказам
      </Button>

      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight mb-2">{order.name}</h1>
        <p className="text-muted-foreground">Клиент: {order.client}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Себестоимость
            </div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(order.actual_cost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Цена наличными
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{formatCurrency(order.cash_price)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Цена безналичными
            </div>
            <div className="text-2xl font-bold font-mono text-blue-600">{formatCurrency(order.cashless_price)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Этапы производства</h2>
        <Dialog open={openStageDialog} onOpenChange={setOpenStageDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-stage-btn" className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить этап
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый этап</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Тип этапа</Label>
                <Select value={newStage.type} onValueChange={(value) => setNewStage({ ...newStage, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(stageTypeLabels).map(type => (
                      <SelectItem key={type} value={type}>{stageTypeLabels[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Мастер</Label>
                <Input
                  value={newStage.master}
                  onChange={(e) => setNewStage({ ...newStage, master: e.target.value })}
                  placeholder="Имя мастера"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Дата начала</Label>
                  <Input
                    type="date"
                    value={newStage.start_date}
                    onChange={(e) => setNewStage({ ...newStage, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Дата окончания</Label>
                  <Input
                    type="date"
                    value={newStage.end_date}
                    onChange={(e) => setNewStage({ ...newStage, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addStage} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {order.stages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Этапов пока нет
            </CardContent>
          </Card>
        ) : (
          order.stages.map((stage) => (
            <Card key={stage.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stageTypeLabels[stage.type]}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge>{stageStatusLabels[stage.status]}</Badge>
                    <Dialog
                      open={openCostDialog && selectedStageId === stage.id}
                      onOpenChange={(open) => {
                        setOpenCostDialog(open);
                        if (open) setSelectedStageId(stage.id);
                        else setSelectedStageId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Plus className="w-3 h-3" />
                          Затраты
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить затраты</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Название</Label>
                            <Input
                              value={newCost.name}
                              onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                              placeholder="Например: Труба 25x25"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Количество</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newCost.quantity}
                                onChange={(e) => setNewCost({ ...newCost, quantity: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>Единица</Label>
                              <Input
                                value={newCost.unit}
                                onChange={(e) => setNewCost({ ...newCost, unit: e.target.value })}
                                placeholder="м, шт, кг"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Цена за ед.</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newCost.price_per_unit}
                              onChange={(e) => setNewCost({ ...newCost, price_per_unit: parseFloat(e.target.value) })}
                            />
                          </div>
                          <Button onClick={addCostItem} className="w-full">
                            Добавить
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {stage.master && (
                  <p className="text-sm text-muted-foreground">Мастер: {stage.master}</p>
                )}
              </CardHeader>
              <CardContent>
                {stage.cost_items && stage.cost_items.length > 0 ? (
                  <div className="space-y-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Позиция</th>
                          <th className="pb-2 font-medium text-right">Кол-во</th>
                          <th className="pb-2 font-medium text-right font-mono">Цена</th>
                          <th className="pb-2 font-medium text-right font-mono">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage.cost_items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.name}</td>
                            <td className="py-2 text-right">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2 text-right font-mono">
                              {formatCurrency(item.price_per_unit)}
                            </td>
                            <td className="py-2 text-right font-mono font-semibold">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td colSpan={3} className="py-2 text-right">Итого по этапу:</td>
                          <td className="py-2 text-right font-mono text-lg">
                            {formatCurrency(stage.total_cost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Затраты пока не добавлены
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderDetail;