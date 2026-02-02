import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    inn: '',
    contact_person: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setFormData({ name: '', inn: '', contact_person: '', phone: '', email: '', notes: '' });
    setOpenDialog(true);
  };

  const openEditClientDialog = (client, e) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name,
      inn: client.inn || '',
      contact_person: client.contact_person || '',
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || '',
    });
    setEditDialog(true);
  };

  const createClient = async () => {
    try {
      await axios.post(`${API}/clients`, formData);
      setOpenDialog(false);
      setFormData({ name: '', inn: '', contact_person: '', phone: '', email: '', notes: '' });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const saveClient = async () => {
    try {
      await axios.put(`${API}/clients/${editingClient.id}`, formData);
      setEditDialog(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const deleteClient = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить заказчика?')) return;
    try {
      await axios.delete(`${API}/clients/${id}`);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/clients`, {
        params: { search: searchQuery }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const ClientFormFields = () => (
    <>
      <div>
        <Label className="text-[#212121]">Название компании</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="ООО Компания"
          className="border-[#DCDCDC]"
          data-testid="client-name-input"
        />
      </div>
      <div>
        <Label className="text-[#212121]">ИНН</Label>
        <Input
          value={formData.inn}
          onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
          placeholder="1234567890"
          className="border-[#DCDCDC]"
        />
      </div>
      <div>
        <Label className="text-[#212121]">Контактное лицо</Label>
        <Input
          value={formData.contact_person}
          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          placeholder="Иван Иванов"
          className="border-[#DCDCDC]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-[#212121]">Телефон</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+7 (999) 123-45-67"
            className="border-[#DCDCDC]"
          />
        </div>
        <div>
          <Label className="text-[#212121]">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            className="border-[#DCDCDC]"
          />
        </div>
      </div>
      <div>
        <Label className="text-[#212121]">Примечания</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Дополнительная информация"
          className="border-[#DCDCDC]"
        />
      </div>
    </>
  );

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: 'Заказчики' }]} />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-[#212121]">Заказчики</h1>
          <p className="text-[#7A7A79]">Управление контрагентами и заказчиками</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button 
              data-testid="create-client-btn" 
              className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4" />
              Добавить заказчика
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#212121]">Новый заказчик</DialogTitle>
              <DialogDescription>
                Добавьте информацию о новом заказчике
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <ClientFormFields />
              <Button
                data-testid="submit-client-btn"
                onClick={createClient}
                className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
                disabled={!formData.name}
              >
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6 border-[#DCDCDC] shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7A7A79]" />
            <Input
              data-testid="search-clients-input"
              placeholder="Поиск по названию, ИНН или контактному лицу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 border-[#DCDCDC]"
            />
          </div>
          <Button onClick={handleSearch} className="bg-[#384E84] hover:bg-[#2d3e6a]">Найти</Button>
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
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">ИНН</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Контактное лицо</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Телефон</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Email</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-[#7A7A79]">
                    Заказчиков не найдено
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    data-testid={`client-row-${client.id}`}
                    className="cursor-pointer border-b border-[#DCDCDC]"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium text-[#212121]">{client.name}</TableCell>
                    <TableCell className="text-[#7A7A79]">{client.inn || '—'}</TableCell>
                    <TableCell className="text-[#212121]">{client.contact_person || '—'}</TableCell>
                    <TableCell className="text-[#7A7A79]">{client.phone || '—'}</TableCell>
                    <TableCell className="text-[#7A7A79]">{client.email || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => openEditClientDialog(client, e)}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-[#384E84]"
                          data-testid={`edit-client-${client.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => deleteClient(client.id, e)}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-red-500"
                          data-testid={`delete-client-${client.id}`}
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

      {/* Edit Client Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#212121]">Редактировать заказчика</DialogTitle>
            <DialogDescription>
              Измените информацию о заказчике
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ClientFormFields />
            <Button
              onClick={saveClient}
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              disabled={!formData.name}
              data-testid="save-client-btn"
            >
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
