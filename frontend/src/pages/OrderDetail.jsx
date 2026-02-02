import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Edit2, 
  Download, FileText, Clock, CheckCircle, AlertCircle, 
  User, Calendar, Package, DollarSign, Upload, File, Save, X
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
  
  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [editedStages, setEditedStages] = useState([]);
  
  // Clients for dropdown
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  
  // Dialogs for adding new items
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
    fetchClients();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
      const expanded = {};
      response.data.stages.forEach(s => { expanded[s.id] = true; });
      setExpandedStages(expanded);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const createNewClient = async () => {
    if (!newClient.name.trim()) return;
    try {
      const response = await axios.post(`${API}/clients`, newClient);
      setClients([response.data, ...clients]);
      setEditedOrder({ ...editedOrder, client: response.data.name });
      setOpenNewClientDialog(false);
      setNewClient({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Enter edit mode
  const enterEditMode = () => {
    setEditedOrder({
      name: order.name,
      client: order.client,
      status: order.status,
      planned_completion_date: order.planned_completion_date || '',
      notes: order.notes || '',
    });
    setClientSearch(order.client || '');
    setEditedStages(JSON.parse(JSON.stringify(order.stages))); // Deep copy
    setIsEditMode(true);
  };

  // Cancel edit mode
  const cancelEditMode = () => {
    setEditedOrder(null);
    setEditedStages([]);
    setIsEditMode(false);
  };

  // Save all changes
  const saveAllChanges = async () => {
    try {
      // Prepare update data including stages
      const updateData = {
        name: editedOrder.name,
        client: editedOrder.client,
        status: editedOrder.status,
        planned_completion_date: editedOrder.planned_completion_date,
        notes: editedOrder.notes,
        stages: editedStages,
      };
      
      await axios.put(`${API}/orders/${orderId}`, updateData);
      
      setIsEditMode(false);
      fetchOrder();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  // Update edited stage
  const updateEditedStage = (stageIndex, field, value) => {
    const newStages = [...editedStages];
    newStages[stageIndex] = { ...newStages[stageIndex], [field]: value };
    setEditedStages(newStages);
  };

  // Update cost item in edited stage
  const updateEditedCostItem = (stageIndex, costIndex, field, value) => {
    const newStages = [...editedStages];
    const costItems = [...(newStages[stageIndex].cost_items || [])];
    costItems[costIndex] = { ...costItems[costIndex], [field]: value };
    
    // Recalculate total
    if (field === 'quantity' || field === 'price_per_unit') {
      costItems[costIndex].total = costItems[costIndex].quantity * costItems[costIndex].price_per_unit;
    }
    
    newStages[stageIndex].cost_items = costItems;
    newStages[stageIndex].total_cost = costItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setEditedStages(newStages);
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
    const stages = isEditMode ? editedStages : (order?.stages || []);
    return stages.flatMap(stage => 
      (stage.cost_items || []).filter(item => item.unit === 'ч').map(item => ({
        ...item,
        stageType: stage.type,
        stageMaster: stage.master,
      }))
    );
  };

  const getAllMaterials = () => {
    const stages = isEditMode ? editedStages : (order?.stages || []);
    return stages.flatMap(stage => 
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
  const displayStages = isEditMode ? editedStages : order.stages;
  const progress = displayStages.length > 0 
    ? Math.round((displayStages.filter(s => s.status === 'completed').length / displayStages.length) * 100)
    : 0;

  // Get display values (edited or original)
  const displayName = isEditMode ? editedOrder.name : order.name;
  const displayClient = isEditMode ? editedOrder.client : order.client;
  const displayStatus = isEditMode ? editedOrder.status : order.status;
  const displayNotes = isEditMode ? editedOrder.notes : order.notes;
  const displayDeadline = isEditMode ? editedOrder.planned_completion_date : order.planned_completion_date;

  return (
    <div className="p-8">
      <Breadcrumbs items={[
        { label: 'Заказы', href: '/orders' },
        { label: displayName }
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {isEditMode ? (
            <div className="space-y-3">
              <Input
                value={editedOrder.name}
                onChange={(e) => setEditedOrder({ ...editedOrder, name: e.target.value })}
                className="text-3xl font-bold h-auto py-2 border-[#384E84]"
                data-testid="edit-order-name"
              />
              <div className="flex items-center gap-2">
                <Label className="text-[#7A7A79]">Статус:</Label>
                <Select 
                  value={editedOrder.status} 
                  onValueChange={(value) => setEditedOrder({ ...editedOrder, status: value })}
                >
                  <SelectTrigger className="w-40 border-[#384E84]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#212121]">{displayName}</h1>
                <Badge className={
                  displayStatus === 'completed' ? 'bg-green-600 text-white' :
                  displayStatus === 'production' ? 'bg-[#384E84] text-white' :
                  'bg-gray-200 text-[#212121]'
                }>
                  {orderStatusLabels[displayStatus]}
                </Badge>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                className="gap-2 border-[#DCDCDC]"
                onClick={cancelEditMode}
              >
                <X className="w-4 h-4" />
                Отмена
              </Button>
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={saveAllChanges}
                data-testid="save-all-btn"
              >
                <Save className="w-4 h-4" />
                Сохранить всё
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="gap-2 border-[#DCDCDC]"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4" />
                Скачать PDF
              </Button>
              <Button
                className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
                onClick={enterEditMode}
                data-testid="edit-order-btn"
              >
                <Edit2 className="w-4 h-4" />
                Редактировать
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode indicator */}
      {isEditMode && (
        <div className="bg-[#384E84] text-white px-4 py-2 rounded-lg mb-6 flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          <span>Режим редактирования — изменения будут сохранены после нажатия "Сохранить всё"</span>
        </div>
      )}

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
                      {isEditMode ? (
                        <Input
                          type="date"
                          value={editedOrder.planned_completion_date}
                          onChange={(e) => setEditedOrder({ ...editedOrder, planned_completion_date: e.target.value })}
                          className="border-[#384E84]"
                        />
                      ) : (
                        <div className="text-[#212121]">{formatDate(displayDeadline)}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7A7A79] uppercase mb-1">Описание</div>
                    {isEditMode ? (
                      <Textarea
                        value={editedOrder.notes}
                        onChange={(e) => setEditedOrder({ ...editedOrder, notes: e.target.value })}
                        className="border-[#384E84]"
                        rows={3}
                        placeholder="Добавьте описание..."
                      />
                    ) : (
                      <div className="text-[#212121]">{displayNotes || '—'}</div>
                    )}
                  </div>
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
                    {displayStages.slice(0, 3).map((stage, index) => (
                      <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            stage.status === 'completed' ? 'bg-green-600' :
                            stage.status === 'in_progress' ? 'bg-[#384E84]' : 'bg-[#DCDCDC]'
                          }`} />
                          <span className="font-medium text-[#212121]">{stageTypeLabels[stage.type]}</span>
                        </div>
                        {isEditMode ? (
                          <Select 
                            value={stage.status} 
                            onValueChange={(value) => updateEditedStage(index, 'status', value)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs border-[#384E84]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(stageStatusLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={
                            stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                            stage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {stageStatusLabels[stage.status]}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {displayStages.length === 0 && (
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
              {displayStages.map((stage, stageIndex) => (
                <Card key={stage.id} className={`border-[#DCDCDC] ${isEditMode ? 'border-[#384E84]' : ''}`}>
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleStage(stage.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium
                        ${stage.status === 'completed' ? 'bg-green-600' : 
                          stage.status === 'in_progress' ? 'bg-[#384E84]' : 'bg-[#7A7A79]'}`}
                      >
                        {stageTypeLabels[stage.type]?.[0]}
                      </div>
                      <div className="flex-1">
                        {isEditMode ? (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={stage.type} 
                              onValueChange={(value) => updateEditedStage(stageIndex, 'type', value)}
                            >
                              <SelectTrigger className="w-32 border-[#384E84]" onClick={e => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(stageTypeLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={stage.master || ''}
                              onChange={(e) => updateEditedStage(stageIndex, 'master', e.target.value)}
                              placeholder="Мастер"
                              className="w-32 border-[#384E84]"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-[#212121]">{stageTypeLabels[stage.type]}</div>
                            <div className="text-sm text-[#7A7A79]">
                              {(stage.cost_items || []).length} позиций
                              {stage.master && ` • ${stage.master}`}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {isEditMode ? (
                        <Select 
                          value={stage.status} 
                          onValueChange={(value) => updateEditedStage(stageIndex, 'status', value)}
                        >
                          <SelectTrigger className="w-32 border-[#384E84]" onClick={e => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(stageStatusLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
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
                      )}
                      {expandedStages[stage.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                  
                  {expandedStages[stage.id] && (
                    <div className="border-t border-[#DCDCDC] p-4 bg-gray-50">
                      {isEditMode && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-xs text-[#7A7A79]">Дата начала</Label>
                            <Input
                              type="date"
                              value={stage.start_date || ''}
                              onChange={(e) => updateEditedStage(stageIndex, 'start_date', e.target.value)}
                              className="border-[#384E84]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[#7A7A79]">Дата окончания</Label>
                            <Input
                              type="date"
                              value={stage.end_date || ''}
                              onChange={(e) => updateEditedStage(stageIndex, 'end_date', e.target.value)}
                              className="border-[#384E84]"
                            />
                          </div>
                        </div>
                      )}
                      
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
                            {stage.cost_items.map((item, costIndex) => (
                              <tr key={item.id} className="border-b border-gray-200">
                                {isEditMode ? (
                                  <>
                                    <td className="py-2">
                                      <Input
                                        value={item.name}
                                        onChange={(e) => updateEditedCostItem(stageIndex, costIndex, 'name', e.target.value)}
                                        className="h-8 border-[#384E84]"
                                      />
                                    </td>
                                    <td className="py-2">
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateEditedCostItem(stageIndex, costIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-20 text-right border-[#384E84]"
                                      />
                                    </td>
                                    <td className="py-2">
                                      <Input
                                        type="number"
                                        value={item.price_per_unit}
                                        onChange={(e) => updateEditedCostItem(stageIndex, costIndex, 'price_per_unit', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-24 text-right border-[#384E84]"
                                      />
                                    </td>
                                    <td className="py-2 text-right font-medium text-[#212121]">
                                      {formatCurrency(item.quantity * item.price_per_unit)}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-2 text-[#212121]">{item.name}</td>
                                    <td className="py-2 text-right text-[#7A7A79]">{item.quantity} {item.unit}</td>
                                    <td className="py-2 text-right text-[#7A7A79]">{formatCurrency(item.price_per_unit)}</td>
                                    <td className="py-2 text-right font-medium text-[#212121]">{formatCurrency(item.total)}</td>
                                  </>
                                )}
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
                      {formatCurrency(getAllWorks().reduce((sum, w) => sum + (w.total || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-[#7A7A79]">Материалы</span>
                    <span className="font-bold text-[#212121]">
                      {formatCurrency(getAllMaterials().reduce((sum, m) => sum + (m.total || 0), 0))}
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
                  {displayClient?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-medium text-[#212121]">{displayClient}</div>
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
                <span className="text-sm text-[#212121]">{formatDate(displayDeadline)}</span>
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
                <span className="text-sm font-medium text-[#212121]">{displayStages.length}</span>
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
