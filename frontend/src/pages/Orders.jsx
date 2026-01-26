import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  draft: 'bg-gray-200 text-gray-900 border-gray-300',
  project: 'bg-[#384E84] text-white border-[#384E84]',
  estimation: 'bg-gray-200 text-gray-900 border-gray-300',
  production: 'bg-[#384E84] text-white border-[#384E84]',
  completed: 'bg-[#7A7A79] text-white border-[#7A7A79]',
  cancelled: 'bg-gray-200 text-gray-900 border-gray-300',
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    name: '',
    client: '',
    planned_completion_date: '',
    notes: '',
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    client: '',
    planned_completion_date: '',
    notes: '',
    status: 'draft',
  });


  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

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

  const createOrder = async () => {
    try {
      await axios.post(`${API}/orders`, newOrder);
      setOpenDialog(false);
      setNewOrder({ name: '', client: '', planned_completion_date: '', notes: '' });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const openEditDialog = (order) => {
    setEditingOrder(order);
    setEditForm({
      name: order.name,
      client: order.client,
      planned_completion_date: order.planned_completion_date || '',
      notes: order.notes || '',
      status: order.status,
    });
    setEditDialogOpen(true);
  };

  const updateOrder = async () => {
    try {
      await axios.put(`${API}/orders/${editingOrder.id}`, editForm);
      setEditDialogOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Удалить заказ?')) return;
    try {
      await axios.delete(`${API}/orders/${id}`);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Text search filter
    const matchesSearch = searchQuery === '' || 
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    
    // Client filter
    const matchesClient = clientFilter === '' || 
      order.client.toLowerCase().includes(clientFilter.toLowerCase());
    
    // Date range filter
    let matchesDate = true;
    if (dateFromFilter || dateToFilter) {
      const orderDate = new Date(order.order_date);
      if (dateFromFilter) {
        matchesDate = matchesDate && orderDate >= new Date(dateFromFilter);
      }
      if (dateToFilter) {
        matchesDate = matchesDate && orderDate <= new Date(dateToFilter);
      }
    }
    
    return matchesSearch && matchesStatus && matchesClient && matchesDate;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setClientFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const uniqueClients = [...new Set(orders.map(o => o.client))].sort();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Заказы</h1>
          <p className="text-gray-900">Управление заказами и производством</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-order-btn" className="gap-2">
              <Plus className="w-4 h-4" />
              Создать заказ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый заказ</DialogTitle>
              <DialogDescription>
                Создайте новый заказ, указав основную информацию
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Название изделия</Label>
                <Input
                  id="name"
                  data-testid="order-name-input"
                  value={newOrder.name}
                  onChange={(e) => setNewOrder({ ...newOrder, name: e.target.value })}
                  placeholder="Например: Обеденный стол"
                />
              </div>
              <div>
                <Label htmlFor="client">Клиент</Label>
                <Input
                  id="client"
                  data-testid="order-client-input"
                  value={newOrder.client}
                  onChange={(e) => setNewOrder({ ...newOrder, client: e.target.value })}
                  placeholder="Имя клиента"
                />
              </div>
              <div>
                <Label htmlFor="completion_date">Плановая дата завершения</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={newOrder.planned_completion_date}
                  onChange={(e) => setNewOrder({ ...newOrder, planned_completion_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Примечания</Label>
                <Input
                  id="notes"
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Дополнительные заметки"
                />
              </div>
              <Button
                data-testid="submit-order-btn"
                onClick={createOrder}
                className="w-full"
                disabled={!newOrder.name || !newOrder.client}
              >
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6 border-gray-300 shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-900" />
            <Input
              data-testid="search-orders-input"
              placeholder="Поиск по названию или клиенту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            data-testid="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded border-2 border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#384E84] focus:ring-opacity-20 focus:border-[#384E84]"
          >
            <option value="">Все статусы</option>
            {Object.keys(statusLabels).map(status => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="border-gray-300 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold w-20"></TableHead>
                <TableHead className="font-semibold">Название</TableHead>
                <TableHead className="font-semibold">Клиент</TableHead>
                <TableHead className="font-semibold">Статус</TableHead>
                <TableHead className="font-semibold">Дата заказа</TableHead>
                <TableHead className="font-semibold">План. завершение</TableHead>
                <TableHead className="font-semibold font-mono">Себестоимость</TableHead>
                <TableHead className="font-semibold font-mono">Цена продажи</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-900">
                    Заказов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    data-testid={`order-row-${order.id}`}
                    className="cursor-pointer"
                  >
                    <TableCell className="w-20">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(order);
                          }}
                          data-testid={`edit-order-${order.id}`}
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOrder(order.id);
                          }}
                          data-testid={`delete-order-${order.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => navigate(`/orders/${order.id}`)}>{order.name}</TableCell>
                    <TableCell onClick={() => navigate(`/orders/${order.id}`)}>{order.client}</TableCell>
                    <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900" onClick={() => navigate(`/orders/${order.id}`)}>
                      {formatDate(order.order_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900" onClick={() => navigate(`/orders/${order.id}`)}>
                      {formatDate(order.planned_completion_date)}
                    </TableCell>
                    <TableCell className="text-sm" onClick={() => navigate(`/orders/${order.id}`)}>
                      {formatCurrency(order.actual_cost)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold" onClick={() => navigate(`/orders/${order.id}`)}>
                      {formatCurrency(order.cash_price)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать заказ</DialogTitle>
            <DialogDescription>
              Измените информацию о заказе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Название изделия</Label>
              <Input
                id="edit-name"
                data-testid="edit-order-name-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-client">Клиент</Label>
              <Input
                id="edit-client"
                data-testid="edit-order-client-input"
                value={editForm.client}
                onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Статус</Label>
              <select
                id="edit-status"
                data-testid="edit-order-status-select"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full h-9 rounded border-2 border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#384E84] focus:ring-opacity-20 focus:border-[#384E84]"
              >
                {Object.keys(statusLabels).map(status => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-completion_date">Плановая дата завершения</Label>
              <Input
                id="edit-completion_date"
                type="date"
                value={editForm.planned_completion_date}
                onChange={(e) => setEditForm({ ...editForm, planned_completion_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Примечания</Label>
              <Input
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <Button
              data-testid="save-order-btn"
              onClick={updateOrder}
              className="w-full"
              disabled={!editForm.name || !editForm.client}
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;