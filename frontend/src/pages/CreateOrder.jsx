import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STEPS = [
  { id: 1, name: 'Информация', key: 'info' },
  { id: 2, name: 'Заказчик', key: 'client' },
  { id: 3, name: 'Состав', key: 'composition' },
  { id: 4, name: 'Этапы', key: 'stages' },
  { id: 5, name: 'Финансы', key: 'finance' },
];

const STAGE_TYPES = [
  { value: 'welding', label: 'Сварка' },
  { value: 'painting', label: 'Покраска' },
  { value: 'woodwork', label: 'Столярка' },
  { value: 'upholstery', label: 'Обивка' },
  { value: 'project', label: 'Проект' },
  { value: 'estimation', label: 'Смета' },
];

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критичный' },
];

const CreateOrder = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const [orderData, setOrderData] = useState({
    // Step 1: Info
    orderNumber: `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    name: '',
    startDate: '',
    deadline: '',
    priority: 'normal',
    
    // Step 2: Client
    clientId: '',
    clientName: '',
    clientInfo: null,
    
    // Step 3: Composition
    items: [],
    
    // Step 4: Stages
    stages: [],
    
    // Step 5: Finance (calculated)
    costPrice: 0,
    salePrice: 0,
    margin: 0,
    marginPercent: 0,
  });

  useEffect(() => {
    fetchClients();
    fetchMaterials();
  }, []);

  useEffect(() => {
    calculateFinancials();
  }, [orderData.items, orderData.stages]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const calculateFinancials = () => {
    const itemsCost = orderData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const stagesCost = orderData.stages.reduce((sum, stage) => {
      return sum + stage.works.reduce((workSum, work) => workSum + (work.hours * work.rate), 0);
    }, 0);
    
    const costPrice = itemsCost + stagesCost;
    const salePrice = costPrice * 1.6; // 60% markup
    const margin = salePrice - costPrice;
    const marginPercent = costPrice > 0 ? ((margin / costPrice) * 100) : 0;
    
    setOrderData(prev => ({
      ...prev,
      costPrice,
      salePrice,
      margin,
      marginPercent,
    }));
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.inn && c.inn.includes(clientSearch))
  );

  const selectClient = (client) => {
    setOrderData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientInfo: client,
    }));
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const addItem = () => {
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: `item_${Date.now()}`,
        name: '',
        article: '',
        quantity: 1,
        pricePerUnit: 0,
      }],
    }));
  };

  const updateItem = (index, field, value) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addStage = () => {
    setOrderData(prev => ({
      ...prev,
      stages: [...prev.stages, {
        id: `stage_${Date.now()}`,
        type: 'welding',
        works: [],
        totalHours: 0,
        totalCost: 0,
      }],
    }));
  };

  const updateStage = (stageIndex, field, value) => {
    setOrderData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === stageIndex ? { ...stage, [field]: value } : stage
      ),
    }));
  };

  const removeStage = (stageIndex) => {
    setOrderData(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== stageIndex),
    }));
  };

  const addWork = (stageIndex) => {
    setOrderData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => {
        if (i === stageIndex) {
          const newWorks = [...stage.works, {
            id: `work_${Date.now()}`,
            name: '',
            hours: 0,
            rate: 500,
          }];
          const totalHours = newWorks.reduce((sum, w) => sum + w.hours, 0);
          const totalCost = newWorks.reduce((sum, w) => sum + (w.hours * w.rate), 0);
          return { ...stage, works: newWorks, totalHours, totalCost };
        }
        return stage;
      }),
    }));
  };

  const updateWork = (stageIndex, workIndex, field, value) => {
    setOrderData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => {
        if (i === stageIndex) {
          const newWorks = stage.works.map((work, j) => 
            j === workIndex ? { ...work, [field]: value } : work
          );
          const totalHours = newWorks.reduce((sum, w) => sum + parseFloat(w.hours || 0), 0);
          const totalCost = newWorks.reduce((sum, w) => sum + (parseFloat(w.hours || 0) * parseFloat(w.rate || 0)), 0);
          return { ...stage, works: newWorks, totalHours, totalCost };
        }
        return stage;
      }),
    }));
  };

  const removeWork = (stageIndex, workIndex) => {
    setOrderData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => {
        if (i === stageIndex) {
          const newWorks = stage.works.filter((_, j) => j !== workIndex);
          const totalHours = newWorks.reduce((sum, w) => sum + w.hours, 0);
          const totalCost = newWorks.reduce((sum, w) => sum + (w.hours * w.rate), 0);
          return { ...stage, works: newWorks, totalHours, totalCost };
        }
        return stage;
      }),
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' ₽';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return orderData.name && orderData.deadline;
      case 2:
        return orderData.clientName;
      case 3:
        return true; // Optional
      case 4:
        return true; // Optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const saveDraft = async () => {
    try {
      const payload = {
        name: orderData.name,
        client: orderData.clientName,
        planned_completion_date: orderData.deadline,
        notes: `Приоритет: ${orderData.priority}. Номер: ${orderData.orderNumber}`,
      };
      await axios.post(`${API}/orders`, payload);
      navigate('/orders');
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const createOrder = async () => {
    try {
      // Create the order
      const orderPayload = {
        name: orderData.name,
        client: orderData.clientName,
        planned_completion_date: orderData.deadline,
        notes: `Приоритет: ${orderData.priority}. Номер: ${orderData.orderNumber}`,
      };
      const orderResponse = await axios.post(`${API}/orders`, orderPayload);
      const orderId = orderResponse.data.id;

      // Add stages and cost items
      for (const stage of orderData.stages) {
        const stagePayload = {
          type: stage.type,
          status: 'not_started',
        };
        const stageResponse = await axios.post(`${API}/orders/${orderId}/stages`, stagePayload);
        const stageId = stageResponse.data.id;

        // Add works as cost items
        for (const work of stage.works) {
          if (work.name && work.hours > 0) {
            await axios.post(`${API}/orders/${orderId}/stages/${stageId}/costs`, {
              name: work.name,
              quantity: work.hours,
              unit: 'ч',
              price_per_unit: work.rate,
            });
          }
        }
      }

      // Add composition items as cost items to a general stage
      if (orderData.items.length > 0) {
        // Create a materials stage
        const matStageResponse = await axios.post(`${API}/orders/${orderId}/stages`, {
          type: 'estimation',
          status: 'not_started',
        });
        const matStageId = matStageResponse.data.id;

        for (const item of orderData.items) {
          if (item.name && item.quantity > 0) {
            await axios.post(`${API}/orders/${orderId}/stages/${matStageId}/costs`, {
              name: item.name,
              quantity: item.quantity,
              unit: 'шт',
              price_per_unit: item.pricePerUnit,
            });
          }
        }
      }

      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const getStageLabel = (type) => {
    return STAGE_TYPES.find(s => s.value === type)?.label || type;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-[#212121]">Номер заказа</Label>
                <Input
                  value={orderData.orderNumber}
                  disabled
                  className="bg-gray-50 text-[#7A7A79]"
                  data-testid="order-number-input"
                />
              </div>
              <div>
                <Label className="text-[#212121]">Название проекта *</Label>
                <Input
                  value={orderData.name}
                  onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                  placeholder="Например: Кухонный гарнитур"
                  data-testid="order-name-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-[#212121]">Дата начала</Label>
                <Input
                  type="date"
                  value={orderData.startDate}
                  onChange={(e) => setOrderData({ ...orderData, startDate: e.target.value })}
                  data-testid="start-date-input"
                />
              </div>
              <div>
                <Label className="text-[#212121]">Дедлайн *</Label>
                <Input
                  type="date"
                  value={orderData.deadline}
                  onChange={(e) => setOrderData({ ...orderData, deadline: e.target.value })}
                  data-testid="deadline-input"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#212121]">Приоритет</Label>
              <div className="flex gap-4 mt-2">
                {PRIORITY_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={opt.value}
                      checked={orderData.priority === opt.value}
                      onChange={(e) => setOrderData({ ...orderData, priority: e.target.value })}
                      className="w-4 h-4 text-[#384E84] accent-[#384E84]"
                    />
                    <span className={`text-sm ${orderData.priority === opt.value ? 'text-[#212121] font-medium' : 'text-[#7A7A79]'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="relative">
              <Label className="text-[#212121]">Заказчик *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A79]" />
                <Input
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Найти заказчика по названию или ИНН..."
                  className="pl-10"
                  data-testid="client-search-input"
                />
              </div>
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#DCDCDC] rounded shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => selectClient(client)}
                      data-testid={`client-option-${client.id}`}
                    >
                      <div className="font-medium text-[#212121]">{client.name}</div>
                      {client.inn && <div className="text-sm text-[#7A7A79]">ИНН: {client.inn}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {orderData.clientInfo && (
              <Card className="border-[#DCDCDC]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-[#212121]">{orderData.clientInfo.name}</h4>
                      {orderData.clientInfo.inn && (
                        <p className="text-sm text-[#7A7A79] mt-1">ИНН: {orderData.clientInfo.inn}</p>
                      )}
                      {orderData.clientInfo.phone && (
                        <p className="text-sm text-[#7A7A79]">{orderData.clientInfo.phone}</p>
                      )}
                      {orderData.clientInfo.email && (
                        <p className="text-sm text-[#7A7A79]">{orderData.clientInfo.email}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-[#212121]">Состав заказа</h3>
              <Button onClick={addItem} variant="outline" size="sm" className="gap-2" data-testid="add-item-btn">
                <Plus className="w-4 h-4" />
                Добавить позицию
              </Button>
            </div>
            
            {orderData.items.length === 0 ? (
              <div className="text-center py-8 text-[#7A7A79] border border-dashed border-[#DCDCDC] rounded">
                Позиции не добавлены
              </div>
            ) : (
              <div className="border border-[#DCDCDC] rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-[#7A7A79] uppercase text-xs">Наименование / Артикул</th>
                      <th className="px-4 py-3 text-right font-medium text-[#7A7A79] uppercase text-xs w-24">Кол-во</th>
                      <th className="px-4 py-3 text-right font-medium text-[#7A7A79] uppercase text-xs w-32">Цена за ед.</th>
                      <th className="px-4 py-3 text-right font-medium text-[#7A7A79] uppercase text-xs w-32">Сумма</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.items.map((item, index) => (
                      <tr key={item.id} className="border-t border-[#DCDCDC]">
                        <td className="px-4 py-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            placeholder="Название позиции"
                            className="border-0 p-0 h-8 focus:ring-0"
                            data-testid={`item-name-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="border-0 p-0 h-8 text-right focus:ring-0 w-20"
                            data-testid={`item-qty-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => updateItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            className="border-0 p-0 h-8 text-right focus:ring-0 w-28"
                            data-testid={`item-price-${index}`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-[#212121]">
                          {formatCurrency(item.quantity * item.pricePerUnit)}
                        </td>
                        <td className="px-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            data-testid={`remove-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-[#212121]">Производственные этапы</h3>
                <p className="text-sm text-[#7A7A79]">Детализация работ, времени и стоимости</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#7A7A79]">ВСЕГО ЧАСОВ</div>
                <div className="text-xl font-bold text-[#212121]">
                  {orderData.stages.reduce((sum, s) => sum + s.totalHours, 0)} ч
                </div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="bg-gray-50 rounded p-3 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#7A7A79]">Шаг {currentStep} из {STEPS.length}: {STEPS[currentStep - 1].name}</span>
                <span className="text-[#7A7A79]">{Math.round((currentStep / STEPS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded">
                <div 
                  className="h-full bg-[#384E84] rounded transition-all duration-300"
                  style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {orderData.stages.map((stage, stageIndex) => (
              <Card key={stage.id} className="border-[#DCDCDC]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#384E84] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <Select
                          value={stage.type}
                          onValueChange={(value) => updateStage(stageIndex, 'type', value)}
                        >
                          <SelectTrigger className="w-40 border-0 p-0 h-auto font-semibold text-[#212121]" data-testid={`stage-type-${stageIndex}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGE_TYPES.map(st => (
                              <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="text-sm text-[#7A7A79]">{stage.works.length} задачи</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-[#7A7A79]">Итого: {stage.totalHours} ч</div>
                        <div className="font-bold text-[#212121]">{formatCurrency(stage.totalCost)}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStage(stageIndex)}
                        data-testid={`remove-stage-${stageIndex}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Works table */}
                  {stage.works.length > 0 && (
                    <table className="w-full text-sm mb-3">
                      <thead>
                        <tr className="border-b border-[#DCDCDC]">
                          <th className="py-2 text-left font-medium text-[#7A7A79]">Тип работ</th>
                          <th className="py-2 text-right font-medium text-[#7A7A79] w-24">Часы</th>
                          <th className="py-2 text-right font-medium text-[#7A7A79] w-32">Ставка (₽/ч)</th>
                          <th className="py-2 text-right font-medium text-[#7A7A79] w-32">Стоимость</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage.works.map((work, workIndex) => (
                          <tr key={work.id} className="border-b border-gray-100">
                            <td className="py-2">
                              <Input
                                value={work.name}
                                onChange={(e) => updateWork(stageIndex, workIndex, 'name', e.target.value)}
                                placeholder="Название работы"
                                className="border-0 p-0 h-8 focus:ring-0"
                                data-testid={`work-name-${stageIndex}-${workIndex}`}
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.5"
                                value={work.hours}
                                onChange={(e) => updateWork(stageIndex, workIndex, 'hours', parseFloat(e.target.value) || 0)}
                                className="border-0 p-0 h-8 text-right focus:ring-0 w-20"
                                data-testid={`work-hours-${stageIndex}-${workIndex}`}
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                value={work.rate}
                                onChange={(e) => updateWork(stageIndex, workIndex, 'rate', parseFloat(e.target.value) || 0)}
                                className="border-0 p-0 h-8 text-right focus:ring-0 w-28"
                                data-testid={`work-rate-${stageIndex}-${workIndex}`}
                              />
                            </td>
                            <td className="py-2 text-right font-medium text-[#212121]">
                              {formatCurrency(work.hours * work.rate)}
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeWork(stageIndex, workIndex)}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addWork(stageIndex)}
                    className="text-[#384E84] gap-1"
                    data-testid={`add-work-${stageIndex}`}
                  >
                    <Plus className="w-4 h-4" />
                    Добавить работу
                  </Button>
                </CardContent>
              </Card>
            ))}

            <div 
              className="border-2 border-dashed border-[#DCDCDC] rounded-lg p-6 text-center cursor-pointer hover:border-[#384E84] transition-colors"
              onClick={addStage}
              data-testid="add-stage-btn"
            >
              <Plus className="w-6 h-6 mx-auto mb-2 text-[#7A7A79]" />
              <span className="text-[#7A7A79]">Добавить производственный этап</span>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[#212121]">Финансовая сводка</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-[#DCDCDC]">
                <CardContent className="p-6">
                  <div className="fh-summary-label mb-2">Себестоимость</div>
                  <div className="fh-summary-value">{formatCurrency(orderData.costPrice)}</div>
                </CardContent>
              </Card>
              <Card className="border-[#DCDCDC]">
                <CardContent className="p-6">
                  <div className="fh-summary-label mb-2">Цена продажи</div>
                  <div className="fh-summary-value fh-text-primary">{formatCurrency(orderData.salePrice)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#DCDCDC] bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="fh-summary-label mb-2">Маржа</div>
                    <div className="text-3xl font-bold fh-margin-positive">
                      +{formatCurrency(orderData.margin)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold fh-margin-positive">
                      +{orderData.marginPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded p-4 text-sm text-[#384E84]">
              Смета будет отправлена на согласование руководителю производства автоматически.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="text-sm text-[#7A7A79] mb-6">
        Заказы / <span className="text-[#212121]">Создать новый</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#212121]">Создать новый заказ</h1>
          <p className="text-[#7A7A79] mt-1">Заполните информацию о заказе</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded px-4 py-2">
          <div className="text-sm text-[#7A7A79]">ОБЩАЯ СТОИМОСТЬ</div>
          <div className="text-xl font-bold text-[#384E84]">{formatCurrency(orderData.salePrice)}</div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`flex items-center gap-2 cursor-pointer ${step.id <= currentStep ? 'text-[#384E84]' : 'text-[#7A7A79]'}`}
              onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${step.id < currentStep ? 'bg-[#384E84] text-white' : 
                    step.id === currentStep ? 'bg-[#384E84] text-white' : 
                    'bg-gray-200 text-[#7A7A79]'}`}
              >
                {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={`text-sm font-medium ${step.id === currentStep ? 'text-[#212121]' : ''}`}>
                {step.name}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${step.id < currentStep ? 'bg-[#384E84]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <Card className="border-[#DCDCDC] mb-6">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/orders')}
          className="gap-2 text-[#7A7A79]"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={saveDraft}
            className="border-[#DCDCDC]"
            data-testid="save-draft-btn"
          >
            Сохранить черновик
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
              data-testid="next-btn"
            >
              Сохранить и продолжить
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={createOrder}
              className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
              data-testid="create-order-btn"
            >
              Создать заказ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
