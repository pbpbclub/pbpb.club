import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const specializationLabels = {
  welding: 'Сварка',
  painting: 'Покраска',
  woodwork: 'Дерево',
  upholstery: 'Мягкая мебель',
  universal: 'Универсал',
};

const specializationColors = {
  welding: 'bg-[#384E84] text-white border-[#384E84]',
  painting: 'bg-[#7A7A79] text-white border-[#7A7A79]',
  woodwork: 'bg-gray-200 text-gray-900 border-gray-300',
  upholstery: 'bg-[#384E84] text-white border-[#384E84]',
  universal: 'bg-gray-200 text-gray-900 border-gray-300',
};

const Masters = () => {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: 'universal',
    hourly_rate: 0,
    notes: '',
  });

  useEffect(() => {
    fetchMasters();
  }, [specializationFilter]);

  const fetchMasters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (specializationFilter) params.specialization = specializationFilter;
      const response = await axios.get(`${API}/masters`, { params });
      setMasters(response.data);
    } catch (error) {
      console.error('Error fetching masters:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingMaster(null);
    setFormData({ name: '', phone: '', specialization: 'universal', hourly_rate: 0, notes: '' });
    setOpenDialog(true);
  };

  const openEditDialog = (master) => {
    setEditingMaster(master);
    setFormData({
      name: master.name,
      phone: master.phone || '',
      specialization: master.specialization,
      hourly_rate: master.hourly_rate || 0,
      notes: master.notes || '',
    });
    setOpenDialog(true);
  };

  const saveMaster = async () => {
    try {
      if (editingMaster) {
        await axios.put(`${API}/masters/${editingMaster.id}`, formData);
      } else {
        await axios.post(`${API}/masters`, formData);
      }
      setOpenDialog(false);
      fetchMasters();
    } catch (error) {
      console.error('Error saving master:', error);
    }
  };

  const deleteMaster = async (id) => {
    if (!window.confirm('Удалить мастера?')) return;
    try {
      await axios.delete(`${API}/masters/${id}`);
      fetchMasters();
    } catch (error) {
      console.error('Error deleting master:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredMasters = masters.filter(master =>
    master.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Мастера</h1>
          <p className="text-gray-900">Управление мастерами и специалистами</p>
        </div>
        <Button data-testid="create-master-btn" onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить мастера
        </Button>
      </div>

      <Card className="mb-6 border-gray-300 shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-900" />
            <Input
              data-testid="search-masters-input"
              placeholder="Поиск мастеров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            data-testid="filter-specialization-select"
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="h-9 rounded border-2 border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#384E84] focus:ring-opacity-20 focus:border-[#384E84]"
          >
            <option value="">Все специализации</option>
            {Object.keys(specializationLabels).map(spec => (
              <option key={spec} value={spec}>{specializationLabels[spec]}</option>
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
                <TableHead className="font-semibold">Имя</TableHead>
                <TableHead className="font-semibold">Телефон</TableHead>
                <TableHead className="font-semibold">Специализация</TableHead>
                <TableHead className="font-semibold">Ставка/час</TableHead>
                <TableHead className="font-semibold">Примечания</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMasters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-900">
                    Мастеров не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredMasters.map((master) => (
                  <TableRow key={master.id} data-testid={`master-row-${master.id}`}>
                    <TableCell className="w-20">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(master)}
                          data-testid={`edit-master-${master.id}`}
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMaster(master.id)}
                          data-testid={`delete-master-${master.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{master.name}</TableCell>
                    <TableCell>{master.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge className={specializationColors[master.specialization]}>
                        {specializationLabels[master.specialization]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(master.hourly_rate)}/час
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {master.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMaster ? 'Редактировать мастера' : 'Новый мастер'}
            </DialogTitle>
            <DialogDescription>
              {editingMaster ? 'Измените информацию о мастере' : 'Добавьте нового мастера'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                data-testid="master-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иван Петров"
              />
            </div>
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div>
              <Label>Специализация</Label>
              <Select value={formData.specialization} onValueChange={(value) => setFormData({ ...formData, specialization: value })}>
                <SelectTrigger data-testid="master-specialization-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(specializationLabels).map(spec => (
                    <SelectItem key={spec} value={spec}>{specializationLabels[spec]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hourly_rate">Ставка за час (₽)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Примечания</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительные заметки"
              />
            </div>
            <Button
              data-testid="submit-master-btn"
              onClick={saveMaster}
              className="w-full"
              disabled={!formData.name}
            >
              {editingMaster ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Masters;
