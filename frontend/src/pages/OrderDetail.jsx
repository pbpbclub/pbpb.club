import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Edit2, 
  Download, FileText, Clock, CheckCircle, AlertCircle, 
  User, Calendar, Package, DollarSign, Upload, File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const orderStatusLabels = {
  draft: 'Черновик',
  project: 'Проект',
  estimation: 'Смета',
  production: 'Производство',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'stages', label: 'Этапы' },
  { id: 'works', label: 'Работы' },
  { id: 'materials', label: 'Материалы' },
  { id: 'expenses', label: 'Расходы' },
  { id: 'files', label: 'Файлы' },
  { id: 'history', label: 'События' },
];

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedStages, setExpandedStages] = useState({});
  
  // Dialogs
  const [editOrderDialog, setEditOrderDialog] = useState(false);
  const [openStageDialog, setOpenStageDialog] = useState(false);
  const [openCostDialog, setOpenCostDialog] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  
  // Form states
  const [orderForm, setOrderForm] = useState({
    name: '',
    client: '',
    status: 'draft',
    planned_completion_date: '',
    notes: '',
    description: '',
  });
  
  const [newStage, setNewStage] = useState({
    type: 'welding',
    status: 'not_started',
    start_date: '',
    end_date: '',
    master: '',
    notes: '',
    work_name: '',
    work_hours: 0,
    work_rate: 500,
  });
  
  const [newCost, setNewCost] = useState({
    name: '',
    quantity: 0,
    unit: 'ч',
    price_per_unit: 500,
  });

  // Mock files and events
  const [files] = useState([
    { id: 1, name: 'Смета_v1.pdf', type: 'document', date: '2026-01-15' },
    { id: 2, name: 'Макет_3D.png', type: 'image', date: '2026-01-18' },
    { id: 3, name: 'Счет_оплата.pdf', type: 'invoice', date: '2026-01-20' },
  ]);
  
  const [events] = useState([
    { id: 1, type: 'created', message: 'Заказ создан', date: '2026-01-10 10:30', user: 'Менеджер' },
    { id: 2, type: 'status', message: 'Статус изменен на "Производство"', date: '2026-01-12 14:15', user: 'Система' },
    { id: 3, type: 'stage', message: 'Добавлен этап "Сварка"', date: '2026-01-13 09:00', user: 'Мастер' },
  ]);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      setOrderForm({
        name: response.data.name,
        client: response.data.client,
        status: response.data.status,
        planned_completion_date: response.data.planned_completion_date || '',
        notes: response.data.notes || '',
        description: response.data.description || '',
      });
      const expanded = {};
      response.data.stages.forEach(s => { expanded[s.id] = true; });
      setExpandedStages(expanded);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOrderDetails = async () => {
    try {
      await axios.put(`${API}/orders/${orderId}`, orderForm);
      setEditOrderDialog(false);
      fetchOrder();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const addStage = async () => {
    try {
      const stagePayload = {
        type: newStage.type,
        status: newStage.status,
        start_date: newStage.start_date,
        end_date: newStage.end_date,
        master: newStage.master,
        notes: newStage.notes,
      };
      const stageResponse = await axios.post(`${API}/orders/${orderId}/stages`, stagePayload);
      const stageId = stageResponse.data.id;

      if (newStage.work_name && newStage.work_hours > 0) {
        await axios.post(`${API}/orders/${orderId}/stages/${stageId}/costs`, {
          name: newStage.work_name,
          quantity: newStage.work_hours,
          unit: 'ч',
          price_per_unit: newStage.work_rate,
        });
      }

      setOpenStageDialog(false);
      setNewStage({ 
        type: 'welding', status: 'not_started', start_date: '', end_date: '', 
        master: '', notes: '', work_name: '', work_hours: 0, work_rate: 500,
      });
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
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value || 0) + ' ₽';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const calculateMargin = () => {
    if (!order || order.actual_cost === 0) return { amount: 0, percent: 0 };
    const margin = order.cash_price - order.actual_cost;
    const percent = (margin / order.actual_cost) * 100;
    return { amount: margin, percent };
  };

  const getAllWorks = () => {
    if (!order) return [];
    return order.stages.flatMap(stage => 
      (stage.cost_items || []).filter(item => item.unit === 'ч').map(item => ({
        ...item,
        stageType: stage.type,
        stageMaster: stage.master,
      }))
    );
  };

  const getAllMaterials = () => {
    if (!order) return [];
    return order.stages.flatMap(stage => 
      (stage.cost_items || []).filter(item => item.unit !== 'ч').map(item => ({
        ...item,
        stageType: stage.type,
      }))
    );
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
  const progress = order.stages.length > 0 
    ? Math.round((order.stages.filter(s => s.status === 'completed').length / order.stages.length) * 100)
    : 0;

  return (
    <div className="p-8">
      <Breadcrumbs items={[
        { label: 'Заказы', href: '/orders' },
        { label: order.name }
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#212121]">{order.name}</h1>
            <Badge className={
              order.status === 'completed' ? 'bg-green-600 text-white' :
              order.status === 'production' ? 'bg-[#384E84] text-white' :
              'bg-gray-200 text-[#212121]'
            }>
              {orderStatusLabels[order.status]}
            </Badge>
          </div>
          <p className="text-[#7A7A79]">Клиент: {order.client}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 border-[#DCDCDC]"
            onClick={() => window.print()}
            data-testid="download-pdf-btn"
          >
            <Download className="w-4 h-4" />
            Скачать PDF
          </Button>
          <Button
            className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
            onClick={() => setEditOrderDialog(true)}
            data-testid="edit-order-btn"
          >
            <Edit2 className="w-4 h-4" />
            Редактировать
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Смета</div>
            <div className="text-2xl font-bold text-[#212121]">{formatCurrency(order.cash_price)}</div>
            <div className="text-xs text-[#7A7A79] mt-1">Цена для клиента</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Факт (Расходы)</div>
            <div className="text-2xl font-bold text-[#E26A2D]">{formatCurrency(order.actual_cost)}</div>
            <div className="text-xs text-[#7A7A79] mt-1">Себестоимость</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC] bg-gray-50">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Маржа</div>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(margin.amount)}</div>
            <div className="text-xs text-green-600 mt-1">+{margin.percent.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="border-[#DCDCDC]">
          <CardContent className="p-4">
            <div className="text-xs text-[#7A7A79] uppercase mb-1">Прогресс</div>
            <div className="text-2xl font-bold text-[#384E84]">{progress}%</div>
            <div className="h-2 bg-gray-200 rounded mt-2">
              <div 
                className="h-full bg-[#384E84] rounded transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#DCDCDC] mb-6">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id 
                  ? 'border-[#384E84] text-[#384E84]' 
                  : 'border-transparent text-[#7A7A79] hover:text-[#212121]'}`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Order Details */}
              <Card className="border-[#DCDCDC]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-[#212121]">Детали заказа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#7A7A79] uppercase mb-1">Дата создания</div>
                      <div className="text-[#212121]">{formatDate(order.order_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#7A7A79] uppercase mb-1">Дедлайн</div>
                      <div className="text-[#212121]">{formatDate(order.planned_completion_date)}</div>
                    </div>
                  </div>
                  {order.notes && (
                    <div>
                      <div className="text-xs text-[#7A7A79] uppercase mb-1">Описание</div>
                      <div className="text-[#212121]">{order.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stage Overview */}
              <Card className="border-[#DCDCDC]">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-[#212121]">Этапы производства</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('stages')}
                    className="text-[#384E84]"
                  >
                    Все этапы
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.stages.slice(0, 3).map(stage => (
                      <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            stage.status === 'completed' ? 'bg-green-600' :
                            stage.status === 'in_progress' ? 'bg-[#384E84]' : 'bg-[#DCDCDC]'
                          }`} />
                          <span className="font-medium text-[#212121]">{stageTypeLabels[stage.type]}</span>
                        </div>
                        <Badge className={
                          stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                          stage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {stageStatusLabels[stage.status]}
                        </Badge>
                      </div>
                    ))}
                    {order.stages.length === 0 && (
                      <div className="text-center py-4 text-[#7A7A79]">
                        Этапов пока нет
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-4">
              {order.stages.map(stage => (
                <Card key={stage.id} className="border-[#DCDCDC]">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleStage(stage.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium
                        ${stage.status === 'completed' ? 'bg-green-600' : 
                          stage.status === 'in_progress' ? 'bg-[#384E84]' : 'bg-[#7A7A79]'}`}
                      >
                        {stageTypeLabels[stage.type]?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-[#212121]">{stageTypeLabels[stage.type]}</div>
                        <div className="text-sm text-[#7A7A79]">
                          {(stage.cost_items || []).length} позиций
                          {stage.master && ` • ${stage.master}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-[#212121]">{formatCurrency(stage.total_cost)}</div>
                        <Badge className={
                          stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                          stage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {stageStatusLabels[stage.status]}
                        </Badge>
                      </div>
                      {expandedStages[stage.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                  
                  {expandedStages[stage.id] && (
                    <div className="border-t border-[#DCDCDC] p-4 bg-gray-50">
                      {stage.cost_items?.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#DCDCDC]">
                              <th className="pb-2 text-left text-[#7A7A79]">Позиция</th>
                              <th className="pb-2 text-right text-[#7A7A79]">Кол-во</th>
                              <th className="pb-2 text-right text-[#7A7A79]">Цена</th>
                              <th className="pb-2 text-right text-[#7A7A79]">Сумма</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stage.cost_items.map(item => (
                              <tr key={item.id} className="border-b border-gray-200">
                                <td className="py-2 text-[#212121]">{item.name}</td>
                                <td className="py-2 text-right text-[#7A7A79]">{item.quantity} {item.unit}</td>
                                <td className="py-2 text-right text-[#7A7A79]">{formatCurrency(item.price_per_unit)}</td>
                                <td className="py-2 text-right font-medium text-[#212121]">{formatCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-4 text-[#7A7A79]">Работы не добавлены</div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStageId(stage.id);
                          setOpenCostDialog(true);
                        }}
                        className="mt-3 text-[#384E84]"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Добавить работу
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
              
              <div 
                className="border-2 border-dashed border-[#DCDCDC] rounded-lg p-6 text-center cursor-pointer hover:border-[#384E84]"
                onClick={() => setOpenStageDialog(true)}
                data-testid="add-stage-btn"
              >
                <Plus className="w-6 h-6 mx-auto mb-2 text-[#7A7A79]" />
                <span className="text-[#7A7A79]">Добавить этап</span>
              </div>
            </div>
          )}

          {activeTab === 'works' && (
            <Card className="border-[#DCDCDC]">
              <CardHeader>
                <CardTitle className="text-lg text-[#212121]">Работы</CardTitle>
              </CardHeader>
              <CardContent>
                {getAllWorks().length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#DCDCDC]">
                        <th className="pb-2 text-left text-[#7A7A79]">Работа</th>
                        <th className="pb-2 text-left text-[#7A7A79]">Этап</th>
                        <th className="pb-2 text-right text-[#7A7A79]">Часы</th>
                        <th className="pb-2 text-right text-[#7A7A79]">Ставка</th>
                        <th className="pb-2 text-right text-[#7A7A79]">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllWorks().map((work, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 text-[#212121]">{work.name}</td>
                          <td className="py-3 text-[#7A7A79]">{stageTypeLabels[work.stageType]}</td>
                          <td className="py-3 text-right text-[#212121]">{work.quantity}</td>
                          <td className="py-3 text-right text-[#7A7A79]">{formatCurrency(work.price_per_unit)}/ч</td>
                          <td className="py-3 text-right font-medium text-[#212121]">{formatCurrency(work.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-[#7A7A79]">Работы не добавлены</div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'materials' && (
            <Card className="border-[#DCDCDC]">
              <CardHeader>
                <CardTitle className="text-lg text-[#212121]">Материалы</CardTitle>
              </CardHeader>
              <CardContent>
                {getAllMaterials().length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#DCDCDC]">
                        <th className="pb-2 text-left text-[#7A7A79]">Материал</th>
                        <th className="pb-2 text-left text-[#7A7A79]">Этап</th>
                        <th className="pb-2 text-right text-[#7A7A79]">Кол-во</th>
                        <th className="pb-2 text-right text-[#7A7A79]">Цена</th>
                        <th className="pb-2 text-right text-[#7A7A79]">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllMaterials().map((mat, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 text-[#212121]">{mat.name}</td>
                          <td className="py-3 text-[#7A7A79]">{stageTypeLabels[mat.stageType]}</td>
                          <td className="py-3 text-right text-[#212121]">{mat.quantity} {mat.unit}</td>
                          <td className="py-3 text-right text-[#7A7A79]">{formatCurrency(mat.price_per_unit)}</td>
                          <td className="py-3 text-right font-medium text-[#212121]">{formatCurrency(mat.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-[#7A7A79]">Материалы не добавлены</div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'expenses' && (
            <Card className="border-[#DCDCDC]">
              <CardHeader>
                <CardTitle className="text-lg text-[#212121]">Расходы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-[#7A7A79]">Работы</span>
                    <span className="font-bold text-[#212121]">
                      {formatCurrency(getAllWorks().reduce((sum, w) => sum + w.total, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-[#7A7A79]">Материалы</span>
                    <span className="font-bold text-[#212121]">
                      {formatCurrency(getAllMaterials().reduce((sum, m) => sum + m.total, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#384E84] text-white rounded">
                    <span>Итого расходы</span>
                    <span className="text-xl font-bold">{formatCurrency(order.actual_cost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'files' && (
            <Card className="border-[#DCDCDC]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-[#212121]">Файлы</CardTitle>
                <Button size="sm" variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Загрузить
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-[#DCDCDC] rounded hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <File className="w-8 h-8 text-[#384E84]" />
                        <div>
                          <div className="font-medium text-[#212121]">{file.name}</div>
                          <div className="text-xs text-[#7A7A79]">{file.date}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="border-[#DCDCDC]">
              <CardHeader>
                <CardTitle className="text-lg text-[#212121]">История событий</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#384E84] text-white flex items-center justify-center text-xs flex-shrink-0">
                        {event.user.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-[#212121]">{event.message}</div>
                        <div className="text-xs text-[#7A7A79]">{event.date} • {event.user}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#7A7A79] uppercase">Заказчик</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#384E84] text-white flex items-center justify-center font-medium">
                  {order.client.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-[#212121]">{order.client}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#7A7A79] uppercase">Сроки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7A7A79]" />
                <span className="text-sm text-[#7A7A79]">Создан:</span>
                <span className="text-sm text-[#212121]">{formatDate(order.order_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E26A2D]" />
                <span className="text-sm text-[#7A7A79]">Дедлайн:</span>
                <span className="text-sm text-[#212121]">{formatDate(order.planned_completion_date)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-[#DCDCDC]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#7A7A79] uppercase">Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#7A7A79]">Этапов</span>
                <span className="text-sm font-medium text-[#212121]">{order.stages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#7A7A79]">Работ</span>
                <span className="text-sm font-medium text-[#212121]">{getAllWorks().length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#7A7A79]">Материалов</span>
                <span className="text-sm font-medium text-[#212121]">{getAllMaterials().length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={editOrderDialog} onOpenChange={setEditOrderDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Редактировать заказ</DialogTitle>
            <DialogDescription>Измените информацию о заказе</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#212121]">Название</Label>
              <Input
                value={orderForm.name}
                onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                className="border-[#DCDCDC]"
              />
            </div>
            <div>
              <Label className="text-[#212121]">Клиент</Label>
              <Input
                value={orderForm.client}
                onChange={(e) => setOrderForm({ ...orderForm, client: e.target.value })}
                className="border-[#DCDCDC]"
              />
            </div>
            <div>
              <Label className="text-[#212121]">Статус</Label>
              <Select value={orderForm.status} onValueChange={(value) => setOrderForm({ ...orderForm, status: value })}>
                <SelectTrigger className="border-[#DCDCDC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(orderStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#212121]">Дедлайн</Label>
              <Input
                type="date"
                value={orderForm.planned_completion_date}
                onChange={(e) => setOrderForm({ ...orderForm, planned_completion_date: e.target.value })}
                className="border-[#DCDCDC]"
              />
            </div>
            <div>
              <Label className="text-[#212121]">Описание / Примечания</Label>
              <Textarea
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                className="border-[#DCDCDC]"
                rows={3}
              />
            </div>
            <Button 
              onClick={saveOrderDetails} 
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={openStageDialog} onOpenChange={setOpenStageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Новый этап</DialogTitle>
            <DialogDescription>Добавьте этап производства</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                  className="border-[#DCDCDC]"
                />
              </div>
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
            <div className="border-t pt-4">
              <h4 className="font-medium text-[#212121] mb-3">Стоимость работ</h4>
              <div>
                <Label className="text-[#212121]">Название работы</Label>
                <Input
                  value={newStage.work_name}
                  onChange={(e) => setNewStage({ ...newStage, work_name: e.target.value })}
                  className="border-[#DCDCDC]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label className="text-[#212121]">Часы</Label>
                  <Input
                    type="number"
                    value={newStage.work_hours}
                    onChange={(e) => setNewStage({ ...newStage, work_hours: parseFloat(e.target.value) || 0 })}
                    className="border-[#DCDCDC]"
                  />
                </div>
                <div>
                  <Label className="text-[#212121]">Ставка (₽/ч)</Label>
                  <Input
                    type="number"
                    value={newStage.work_rate}
                    onChange={(e) => setNewStage({ ...newStage, work_rate: parseFloat(e.target.value) || 0 })}
                    className="border-[#DCDCDC]"
                  />
                </div>
              </div>
              {newStage.work_hours > 0 && (
                <div className="bg-gray-50 rounded p-3 mt-3 flex justify-between">
                  <span className="text-[#7A7A79]">Итого:</span>
                  <span className="font-bold text-[#212121]">{formatCurrency(newStage.work_hours * newStage.work_rate)}</span>
                </div>
              )}
            </div>
            <Button onClick={addStage} className="w-full bg-[#384E84] hover:bg-[#2d3e6a]">
              Добавить этап
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={openCostDialog} onOpenChange={setOpenCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Добавить работу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#212121]">Название</Label>
              <Input
                value={newCost.name}
                onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                className="border-[#DCDCDC]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[#212121]">Кол-во</Label>
                <Input
                  type="number"
                  value={newCost.quantity}
                  onChange={(e) => setNewCost({ ...newCost, quantity: parseFloat(e.target.value) || 0 })}
                  className="border-[#DCDCDC]"
                />
              </div>
              <div>
                <Label className="text-[#212121]">Ед.</Label>
                <Select value={newCost.unit} onValueChange={(value) => setNewCost({ ...newCost, unit: value })}>
                  <SelectTrigger className="border-[#DCDCDC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ч">ч</SelectItem>
                    <SelectItem value="шт">шт</SelectItem>
                    <SelectItem value="м">м</SelectItem>
                    <SelectItem value="кг">кг</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#212121]">Цена</Label>
                <Input
                  type="number"
                  value={newCost.price_per_unit}
                  onChange={(e) => setNewCost({ ...newCost, price_per_unit: parseFloat(e.target.value) || 0 })}
                  className="border-[#DCDCDC]"
                />
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 flex justify-between">
              <span className="text-[#7A7A79]">Итого:</span>
              <span className="font-bold text-[#212121]">{formatCurrency(newCost.quantity * newCost.price_per_unit)}</span>
            </div>
            <Button 
              onClick={addCostItem} 
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              disabled={!newCost.name}
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
