import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchClient();
    fetchClientOrders();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API}/clients/${clientId}`);
      setClient(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOrders = async () => {
    try {
      const response = await axios.get(`${API}/clients/${clientId}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching client orders:', error);
    }
  };

  const saveClient = async () => {
    try {
      await axios.put(`${API}/clients/${clientId}`, formData);
      setClient(formData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <p>Заказчик не найден</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/clients')}
        className="mb-6 gap-2"
        data-testid="back-to-clients-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к заказчикам
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{client.name}</h1>
        <Button
          onClick={() => editing ? saveClient() : setEditing(true)}
          className="gap-2"
        >
          {editing ? (
            <>
              <Save className="w-4 h-4" />
              Сохранить
            </>
          ) : (
            'Редактировать'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Название контрагента</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label>Полное наименование</Label>
              <Input
                value={formData.legal_name || ''}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ИНН</Label>
                <Input
                  value={formData.inn || ''}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label>КПП</Label>
                <Input
                  value={formData.kpp || ''}
                  onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Контактное лицо</Label>
              <Input
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editing}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="border-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>Реквизиты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Юридический адрес</Label>
              <Input
                value={formData.legal_address || ''}
                onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label>Фактический адрес</Label>
              <Input
                value={formData.actual_address || ''}
                onChange={(e) => setFormData({ ...formData, actual_address: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Название банка</Label>
                <Input
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label>БИК</Label>
                <Input
                  value={formData.bik || ''}
                  onChange={(e) => setFormData({ ...formData, bik: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label>Расчётный счёт</Label>
                <Input
                  value={formData.account_number || ''}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle>Дополнительная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Примечания</Label>
              <Input
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={!editing}
                placeholder="Дополнительные комментарии"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-300 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            История заказов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center py-8 text-gray-900">Заказов пока нет</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Название</TableHead>
                  <TableHead className="font-semibold">Статус</TableHead>
                  <TableHead className="font-semibold">Дата заказа</TableHead>
                  <TableHead className="font-semibold">Себестоимость</TableHead>
                  <TableHead className="font-semibold">Цена продажи</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.name}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(order.order_date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(order.actual_cost)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {formatCurrency(order.cash_price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetail;