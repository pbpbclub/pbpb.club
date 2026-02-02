import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusLabels = {
  draft: 'Черновик',
  project: 'Проект',
  estimation: 'Смета',
  production: 'Производство',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const statusColors = {
  draft: 'bg-gray-200 text-[#212121] border-gray-300',
  project: 'bg-[#384E84] text-white border-[#384E84]',
  estimation: 'bg-gray-200 text-[#212121] border-gray-300',
  production: 'bg-[#384E84] text-white border-[#384E84]',
  completed: 'bg-[#7A7A79] text-white border-[#7A7A79]',
  cancelled: 'bg-gray-200 text-[#212121] border-gray-300',
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    status: 'draft',
    planned_completion_date: '',
    notes: '',
  });
  
  // Clients for dropdown
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, [statusFilter]);

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
      setFormData({ ...formData, client: response.data.name });
      setClientSearch(response.data.name);
      setOpenNewClientDialog(false);
      setNewClient({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await axios.get(`${API}/orders`, { params });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (order, e) => {
    e.stopPropagation();
    setEditingOrder(order);
    setFormData({
      name: order.name,
      client: order.client,
      status: order.status,
      planned_completion_date: order.planned_completion_date || '',
      notes: order.notes || '',
    });
    setClientSearch(order.client || '');
    setEditDialog(true);
  };

  const saveOrder = async () => {
    try {
      await axios.put(`${API}/orders/${editingOrder.id}`, formData);
      setEditDialog(false);
      setShowClientDropdown(false);
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const deleteOrder = async (orderId, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить заказ?')) return;
    try {
      await axios.delete(`${API}/orders/${orderId}`);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value) + ' ₽';
  };

  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: 'Заказы' }]} />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-[#212121]">Заказы</h1>
          <p className="text-[#7A7A79]">Управление заказами и производством</p>
        </div>
        <Button 
          data-testid="create-order-btn" 
          className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
          onClick={() => navigate('/orders/new')}
        >
          <Plus className="w-4 h-4" />
          Создать заказ
        </Button>
      </div>

      <Card className="mb-6 border-[#DCDCDC] shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7A7A79]" />
            <Input
              data-testid="search-orders-input"
              placeholder="Поиск по названию или заказчику..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#DCDCDC]"
            />
          </div>
          <select
            data-testid="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded border border-[#DCDCDC] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#384E84] focus:ring-opacity-20 focus:border-[#384E84]"
          >
            <option value="">Все статусы</option>
            {Object.keys(statusLabels).map(status => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="border-[#DCDCDC] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384E84]"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#DCDCDC]">
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Название</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Заказчик</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Статус</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Дата заказа</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Дедлайн</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right">Себестоимость</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right">Цена</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[#7A7A79]">
                    Заказов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    data-testid={`order-row-${order.id}`}
                    className="cursor-pointer border-b border-[#DCDCDC]"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium text-[#212121]">{order.name}</TableCell>
                    <TableCell className="text-[#212121]">{order.client}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#7A7A79]">
                      {formatDate(order.order_date)}
                    </TableCell>
                    <TableCell className="text-sm text-[#7A7A79]">
                      {formatDate(order.planned_completion_date)}
                    </TableCell>
                    <TableCell className="text-sm text-right text-[#212121]">
                      {formatCurrency(order.actual_cost)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-semibold text-[#384E84]">
                      {formatCurrency(order.cash_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => openEditDialog(order, e)}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-[#384E84]"
                          data-testid={`edit-order-${order.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => deleteOrder(order.id, e)}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-red-500"
                          data-testid={`delete-order-${order.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Редактировать заказ</DialogTitle>
            <DialogDescription>
              Измените информацию о заказе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#212121]">Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-[#DCDCDC]"
                data-testid="edit-order-name-input"
              />
            </div>
            <div className="relative">
              <Label className="text-[#212121]">Заказчик</Label>
              <Input
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setFormData({ ...formData, client: e.target.value });
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Поиск заказчика..."
                className="border-[#DCDCDC]"
                data-testid="edit-order-client-input"
              />
              {showClientDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#DCDCDC] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <div
                        key={client.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData({ ...formData, client: client.name });
                          setClientSearch(client.name);
                          setShowClientDropdown(false);
                        }}
                      >
                        <div className="font-medium text-[#212121]">{client.name}</div>
                        {client.phone && <div className="text-xs text-[#7A7A79]">{client.phone}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[#7A7A79] text-sm">Не найдено</div>
                  )}
                  <div
                    className="px-3 py-2 border-t border-[#DCDCDC] hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-[#384E84]"
                    onClick={() => {
                      setOpenNewClientDialog(true);
                      setShowClientDropdown(false);
                      setNewClient({ ...newClient, name: clientSearch });
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Создать нового заказчика</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label className="text-[#212121]">Статус</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-[#DCDCDC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#212121]">Дедлайн</Label>
              <Input
                type="date"
                value={formData.planned_completion_date}
                onChange={(e) => setFormData({ ...formData, planned_completion_date: e.target.value })}
                className="border-[#DCDCDC]"
              />
            </div>
            <div>
              <Label className="text-[#212121]">Примечания</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-[#DCDCDC]"
              />
            </div>
            <Button 
              onClick={saveOrder} 
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              disabled={!formData.name}
              data-testid="save-order-btn"
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Client Dialog */}
      <Dialog open={openNewClientDialog} onOpenChange={setOpenNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Новый заказчик</DialogTitle>
            <DialogDescription>Создайте нового заказчика</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[#212121]">Название / ФИО *</Label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="border-[#DCDCDC]"
                placeholder="ООО Компания или Иванов И.И."
              />
            </div>
            <div>
              <Label className="text-[#212121]">Телефон</Label>
              <Input
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="border-[#DCDCDC]"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div>
              <Label className="text-[#212121]">Email</Label>
              <Input
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="border-[#DCDCDC]"
                placeholder="email@example.com"
              />
            </div>
            <Button 
              onClick={createNewClient} 
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              disabled={!newClient.name.trim()}
            >
              Создать заказчика
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
