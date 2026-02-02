import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newClient, setNewClient] = useState({
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

  const createClient = async () => {
    try {
      await axios.post(`${API}/clients`, newClient);
      setOpenDialog(false);
      setNewClient({ name: '', inn: '', contact_person: '', phone: '', email: '', notes: '' });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const deleteClient = async (id) => {
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

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: 'Заказчики' }]} />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-[#212121]">Заказчики</h1>
          <p className="text-[#7A7A79]">Управление контрагентами и клиентами</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-client-btn" className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]">
              <Plus className="w-4 h-4" />
              Добавить заказчика
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый заказчик</DialogTitle>
              <DialogDescription>
                Добавьте нового заказчика в систему
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Название контрагента</Label>
                <Input
                  id="name"
                  data-testid="client-name-input"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="ООО Компания"
                />
              </div>
              <div>
                <Label htmlFor="inn">ИНН</Label>
                <Input
                  id="inn"
                  value={newClient.inn}
                  onChange={(e) => setNewClient({ ...newClient, inn: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label htmlFor="contact">Контактное лицо</Label>
                <Input
                  id="contact"
                  value={newClient.contact_person}
                  onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Примечания</Label>
                <Input
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Дополнительная информация"
                />
              </div>
              <Button
                data-testid="submit-client-btn"
                onClick={createClient}
                className="w-full"
                disabled={!newClient.name}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
                          }}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-[#384E84]"
                          data-testid={`edit-client-${client.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteClient(client.id);
                          }}
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
    </div>
  );
};

export default Clients;