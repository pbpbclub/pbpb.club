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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Заказчики</h1>
          <p className="text-gray-900">Управление контрагентами и клиентами</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-client-btn" className="gap-2">
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

      <Card className="mb-6 border-gray-300 shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-900" />
            <Input
              data-testid="search-clients-input"
              placeholder="Поиск по названию, ИНН или контактному лицу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Найти</Button>
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
                <TableHead className="font-semibold">ИНН</TableHead>
                <TableHead className="font-semibold">Контактное лицо</TableHead>
                <TableHead className="font-semibold">Телефон</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-900">
                    Заказчиков не найдено
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    data-testid={`client-row-${client.id}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.inn || '—'}</TableCell>
                    <TableCell>{client.contact_person || '—'}</TableCell>
                    <TableCell>{client.phone || '—'}</TableCell>
                    <TableCell>{client.email || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${client.id}`);
                          }}
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
                          data-testid={`delete-client-${client.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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