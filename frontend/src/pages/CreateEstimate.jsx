import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Trash2, Save, ArrowLeft, Calculator, Percent, 
  Package, Truck, Paintbrush, Wrench, Clock, Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const workTypes = [
  { id: 'welding', label: 'Сварка', icon: Wrench, color: '#E26A2D' },
  { id: 'painting', label: 'Покраска', icon: Paintbrush, color: '#384E84' },
  { id: 'woodwork', label: 'Столярка', icon: Package, color: '#8B4513' },
  { id: 'upholstery', label: 'Обивка', icon: Tag, color: '#6B7280' },
  { id: 'assembly', label: 'Сборка', icon: Wrench, color: '#10B981' },
  { id: 'delivery', label: 'Доставка', icon: Truck, color: '#F59E0B' },
  { id: 'installation', label: 'Монтаж', icon: Wrench, color: '#8B5CF6' },
];

const CreateEstimate = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState([]);

  // Estimate data
  const [workItems, setWorkItems] = useState([]);
  const [materialItems, setMaterialItems] = useState([]);
  const [additionalCosts, setAdditionalCosts] = useState([]);
  
  // Settings
  const [isCashless, setIsCashless] = useState(false); // Безнал +14%
  const [overheadPercent, setOverheadPercent] = useState(0); // Издержки %
  const [marginPercent, setMarginPercent] = useState(60); // Маржа %
  const [selectedStages, setSelectedStages] = useState([]);

  useEffect(() => {
    fetchOrder();
    fetchMaterials();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      
      // Initialize from existing stages if any
      if (response.data.stages && response.data.stages.length > 0) {
        const stages = response.data.stages;
        setSelectedStages(stages.map(s => s.type));
        
        // Convert stages to work items
        const existingWorkItems = stages.flatMap(stage => 
          (stage.cost_items || []).map(item => ({
            id: `${stage.id}_${item.id || Date.now()}`,
            type: stage.type,
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'шт',
            price: item.price_per_unit || 0,
            deadline: stage.end_date || '',
          }))
        );
        if (existingWorkItems.length > 0) {
          setWorkItems(existingWorkItems);
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/materials`);
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  // Add new work item
  const addWorkItem = () => {
    setWorkItems([...workItems, {
      id: Date.now(),
      type: 'welding',
      name: '',
      quantity: 1,
      unit: 'ч',
      price: 500,
      deadline: '',
    }]);
  };

  // Add new material item
  const addMaterialItem = () => {
    setMaterialItems([...materialItems, {
      id: Date.now(),
      materialId: '',
      name: '',
      quantity: 1,
      unit: 'шт',
      price: 0,
    }]);
  };

  // Add additional cost
  const addAdditionalCost = () => {
    setAdditionalCosts([...additionalCosts, {
      id: Date.now(),
      name: '',
      amount: 0,
    }]);
  };

  // Update work item
  const updateWorkItem = (id, field, value) => {
    setWorkItems(workItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Update material item
  const updateMaterialItem = (id, field, value) => {
    setMaterialItems(materialItems.map(item => {
      if (item.id === id) {
        if (field === 'materialId') {
          const material = materials.find(m => m.id === value);
          if (material) {
            return { 
              ...item, 
              materialId: value, 
              name: material.name,
              price: material.price || 0,
              unit: material.unit || 'шт',
            };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Update additional cost
  const updateAdditionalCost = (id, field, value) => {
    setAdditionalCosts(additionalCosts.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Remove item
  const removeWorkItem = (id) => setWorkItems(workItems.filter(item => item.id !== id));
  const removeMaterialItem = (id) => setMaterialItems(materialItems.filter(item => item.id !== id));
  const removeAdditionalCost = (id) => setAdditionalCosts(additionalCosts.filter(item => item.id !== id));

  // Toggle stage
  const toggleStage = (stageType) => {
    if (selectedStages.includes(stageType)) {
      setSelectedStages(selectedStages.filter(s => s !== stageType));
    } else {
      setSelectedStages([...selectedStages, stageType]);
    }
  };

  // Calculate totals
  const workTotal = workItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const materialsTotal = materialItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const additionalTotal = additionalCosts.reduce((sum, item) => sum + Number(item.amount), 0);
  
  const subtotal = workTotal + materialsTotal + additionalTotal;
  const overheadAmount = subtotal * (overheadPercent / 100);
  const costPrice = subtotal + overheadAmount; // Себестоимость
  
  const marginAmount = costPrice * (marginPercent / 100);
  const priceBeforeCashless = costPrice + marginAmount;
  
  const cashlessAmount = isCashless ? priceBeforeCashless * 0.14 : 0;
  const finalPrice = priceBeforeCashless + cashlessAmount; // Цена для заказчика

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Save estimate
  const saveEstimate = async () => {
    setSaving(true);
    try {
      // Group work items by stage type
      const stageMap = {};
      workItems.forEach(item => {
        if (!stageMap[item.type]) {
          stageMap[item.type] = {
            id: `stage_${item.type}_${Date.now()}`,
            type: item.type,
            status: 'not_started',
            cost_items: [],
            total_cost: 0,
            end_date: item.deadline || null,
          };
        }
        stageMap[item.type].cost_items.push({
          id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: item.price,
          total: item.quantity * item.price,
        });
        stageMap[item.type].total_cost += item.quantity * item.price;
        if (item.deadline && (!stageMap[item.type].end_date || item.deadline > stageMap[item.type].end_date)) {
          stageMap[item.type].end_date = item.deadline;
        }
      });

      // Add material costs as a separate stage or to estimation stage
      if (materialItems.length > 0) {
        if (!stageMap['estimation']) {
          stageMap['estimation'] = {
            id: `stage_estimation_${Date.now()}`,
            type: 'estimation',
            status: 'not_started',
            cost_items: [],
            total_cost: 0,
          };
        }
        materialItems.forEach(item => {
          stageMap['estimation'].cost_items.push({
            id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `Материал: ${item.name}`,
            quantity: item.quantity,
            unit: item.unit,
            price_per_unit: item.price,
            total: item.quantity * item.price,
          });
          stageMap['estimation'].total_cost += item.quantity * item.price;
        });
      }

      // Add additional costs
      if (additionalCosts.length > 0) {
        if (!stageMap['estimation']) {
          stageMap['estimation'] = {
            id: `stage_estimation_${Date.now()}`,
            type: 'estimation',
            status: 'not_started',
            cost_items: [],
            total_cost: 0,
          };
        }
        additionalCosts.forEach(item => {
          stageMap['estimation'].cost_items.push({
            id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: item.name,
            quantity: 1,
            unit: 'шт',
            price_per_unit: item.amount,
            total: item.amount,
          });
          stageMap['estimation'].total_cost += Number(item.amount);
        });
      }

      const stages = Object.values(stageMap);

      // Update order with estimate data
      const updateData = {
        stages: stages,
        actual_cost: costPrice,
        sale_price: finalPrice,
        cash_price: priceBeforeCashless,
        cashless_price: finalPrice,
        estimate_settings: {
          is_cashless: isCashless,
          overhead_percent: overheadPercent,
          margin_percent: marginPercent,
        },
      };

      await axios.put(`${API}/orders/${orderId}`, updateData);

      // Log event
      await axios.post(`${API}/orders/${orderId}/events`, {
        event_type: 'updated',
        message: `Смета обновлена. Цена для заказчика: ${formatCurrency(finalPrice)}`,
        user: 'Пользователь',
      });

      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error saving estimate:', error);
    } finally {
      setSaving(false);
    }
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
      <div className="p-8 text-center">
        <p className="text-[#7A7A79]">Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Заказы', href: '/orders' },
        { label: order.name, href: `/orders/${orderId}` },
        { label: 'Смета' }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] mb-1">Создание сметы</h1>
          <p className="text-[#7A7A79]">{order.name} • {order.client}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Button 
            onClick={saveEstimate} 
            disabled={saving}
            className="bg-[#384E84] hover:bg-[#2d3e6a]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить смету'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage tags */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#212121] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#384E84]" />
                Этапы производства
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {workTypes.map(type => (
                  <Badge
                    key={type.id}
                    className={`cursor-pointer transition-all px-3 py-1.5 ${
                      selectedStages.includes(type.id)
                        ? 'bg-[#384E84] text-white hover:bg-[#2d3e6a]'
                        : 'bg-gray-100 text-[#7A7A79] hover:bg-gray-200'
                    }`}
                    onClick={() => toggleStage(type.id)}
                  >
                    <type.icon className="w-3 h-3 mr-1" />
                    {type.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work items */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-[#212121] flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#E26A2D]" />
                Виды работ
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addWorkItem}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {workItems.length === 0 ? (
                <div className="text-center py-8 text-[#7A7A79]">
                  <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Добавьте виды работ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-2">
                        <Label className="text-xs text-[#7A7A79]">Тип</Label>
                        <Select value={item.type} onValueChange={(v) => updateWorkItem(item.id, 'type', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {workTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-[#7A7A79]">Название</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateWorkItem(item.id, 'name', e.target.value)}
                          placeholder="Описание работы"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs text-[#7A7A79]">Кол-во</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateWorkItem(item.id, 'quantity', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs text-[#7A7A79]">Ед.</Label>
                        <Select value={item.unit} onValueChange={(v) => updateWorkItem(item.id, 'unit', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ч">ч</SelectItem>
                            <SelectItem value="шт">шт</SelectItem>
                            <SelectItem value="м">м</SelectItem>
                            <SelectItem value="м²">м²</SelectItem>
                            <SelectItem value="кг">кг</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-[#7A7A79]">Цена</Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateWorkItem(item.id, 'price', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-[#7A7A79]">Срок</Label>
                        <Input
                          type="date"
                          value={item.deadline}
                          onChange={(e) => updateWorkItem(item.id, 'deadline', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#212121]">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => removeWorkItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t">
                    <span className="text-lg font-bold text-[#212121]">
                      Работы: {formatCurrency(workTotal)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-[#212121] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#384E84]" />
                Материалы
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addMaterialItem}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {materialItems.length === 0 ? (
                <div className="text-center py-8 text-[#7A7A79]">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Добавьте материалы из каталога</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materialItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-5">
                        <Label className="text-xs text-[#7A7A79]">Материал</Label>
                        <Select value={item.materialId} onValueChange={(v) => updateMaterialItem(item.id, 'materialId', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Выберите материал" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({formatCurrency(m.price)}/{m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-[#7A7A79]">Кол-во</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateMaterialItem(item.id, 'quantity', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs text-[#7A7A79]">Ед.</Label>
                        <Input value={item.unit} readOnly className="h-9 bg-gray-100" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-[#7A7A79]">Цена</Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateMaterialItem(item.id, 'price', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#212121]">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => removeMaterialItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t">
                    <span className="text-lg font-bold text-[#212121]">
                      Материалы: {formatCurrency(materialsTotal)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional costs */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-[#212121] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#7A7A79]" />
                Дополнительные расходы
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addAdditionalCost}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {additionalCosts.length === 0 ? (
                <div className="text-center py-6 text-[#7A7A79] text-sm">
                  Доставка, монтаж, накладные расходы...
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalCosts.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-8">
                        <Label className="text-xs text-[#7A7A79]">Название</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateAdditionalCost(item.id, 'name', e.target.value)}
                          placeholder="Доставка, монтаж, etc."
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs text-[#7A7A79]">Сумма</Label>
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateAdditionalCost(item.id, 'amount', e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => removeAdditionalCost(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 border-t">
                    <span className="text-lg font-bold text-[#212121]">
                      Доп. расходы: {formatCurrency(additionalTotal)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Summary */}
        <div className="space-y-6">
          {/* Settings */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#212121] flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#E26A2D]" />
                Настройки расчёта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cashless */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="cashless" 
                    checked={isCashless} 
                    onCheckedChange={setIsCashless}
                  />
                  <div>
                    <Label htmlFor="cashless" className="cursor-pointer font-medium text-[#212121]">
                      Безналичный расчёт
                    </Label>
                    <p className="text-xs text-[#7A7A79]">+14% к стоимости</p>
                  </div>
                </div>
                {isCashless && (
                  <Badge className="bg-[#E26A2D] text-white">+14%</Badge>
                )}
              </div>

              {/* Overhead */}
              <div className="space-y-2">
                <Label className="text-[#212121]">Издержки (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={overheadPercent}
                    onChange={(e) => setOverheadPercent(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-24"
                  />
                  <span className="text-[#7A7A79]">%</span>
                  {overheadPercent > 0 && (
                    <span className="text-sm text-[#E26A2D]">
                      +{formatCurrency(overheadAmount)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7A7A79]">Накладные расходы, налоги, etc.</p>
              </div>

              {/* Margin */}
              <div className="space-y-2">
                <Label className="text-[#212121]">Маржа (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(Number(e.target.value))}
                    min={0}
                    max={500}
                    className="w-24"
                  />
                  <span className="text-[#7A7A79]">%</span>
                  <span className="text-sm text-green-600">
                    +{formatCurrency(marginAmount)}
                  </span>
                </div>
                <p className="text-xs text-[#7A7A79]">Прибыль от проекта</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-[#384E84] bg-gradient-to-b from-[#384E84]/5 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#212121]">Итого</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#7A7A79]">Работы:</span>
                <span className="text-[#212121]">{formatCurrency(workTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A7A79]">Материалы:</span>
                <span className="text-[#212121]">{formatCurrency(materialsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A7A79]">Доп. расходы:</span>
                <span className="text-[#212121]">{formatCurrency(additionalTotal)}</span>
              </div>
              
              <div className="border-t border-[#DCDCDC] pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7A79]">Подитог:</span>
                  <span className="text-[#212121]">{formatCurrency(subtotal)}</span>
                </div>
                {overheadPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7A7A79]">Издержки ({overheadPercent}%):</span>
                    <span className="text-[#E26A2D]">+{formatCurrency(overheadAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#DCDCDC] pt-3">
                <div className="flex justify-between">
                  <span className="text-[#7A7A79]">Себестоимость:</span>
                  <span className="font-medium text-[#212121]">{formatCurrency(costPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7A79]">Маржа ({marginPercent}%):</span>
                  <span className="text-green-600">+{formatCurrency(marginAmount)}</span>
                </div>
              </div>

              {isCashless && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#7A7A79]">Безнал (+14%):</span>
                  <span className="text-[#E26A2D]">+{formatCurrency(cashlessAmount)}</span>
                </div>
              )}

              <div className="border-t-2 border-[#384E84] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#212121] font-medium">Цена для заказчика:</span>
                  <span className="text-2xl font-bold text-[#384E84]">{formatCurrency(finalPrice)}</span>
                </div>
                {isCashless && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-[#7A7A79]">При наличном расчёте:</span>
                    <span className="text-[#212121]">{formatCurrency(priceBeforeCashless)}</span>
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-3 mt-4">
                <div className="flex justify-between">
                  <span className="text-green-700">Прибыль:</span>
                  <span className="font-bold text-green-700">{formatCurrency(marginAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Рентабельность:</span>
                  <span className="text-green-600">
                    {costPrice > 0 ? ((marginAmount / costPrice) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-[#DCDCDC]">
            <CardContent className="pt-6">
              <Button 
                onClick={saveEstimate} 
                disabled={saving}
                className="w-full bg-[#384E84] hover:bg-[#2d3e6a] mb-2"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить смету'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/orders/${orderId}`)}
              >
                Отмена
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEstimate;
