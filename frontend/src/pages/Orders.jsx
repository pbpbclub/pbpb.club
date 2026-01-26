import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter } from 'lucide-react';
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
  const [openDialog, setOpenDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    name: '',
    client: '',
    planned_completion_date: '',
    notes: '',
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

  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.name}</TableCell>
                    <TableCell>{order.client}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {formatDate(order.order_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {formatDate(order.planned_completion_date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(order.actual_cost)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {formatCurrency(order.cash_price)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Orders;