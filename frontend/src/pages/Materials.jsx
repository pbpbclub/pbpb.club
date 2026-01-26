import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const materialTypeLabels = {
  metal: 'Металл',
  wood: 'Дерево',
  fabric: 'Ткань',
  paint: 'Краска',
  other: 'Другое',
};

const materialTypeColors = {
  metal: 'bg-slate-100 text-slate-700 border-slate-200',
  wood: 'bg-amber-100 text-amber-700 border-amber-200',
  fabric: 'bg-blue-100 text-blue-700 border-blue-200',
  paint: 'bg-purple-100 text-purple-700 border-purple-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'metal',
    price: 0,
    unit: 'м',
    notes: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, [typeFilter]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const response = await axios.get(`${API}/materials`, { params });
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingMaterial(null);
    setFormData({ name: '', type: 'metal', price: 0, unit: 'м', notes: '' });
    setOpenDialog(true);
  };

  const openEditDialog = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      price: material.price,
      unit: material.unit,
      notes: material.notes || '',
    });
    setOpenDialog(true);
  };

  const saveMaterial = async () => {
    try {
      if (editingMaterial) {
        await axios.put(`${API}/materials/${editingMaterial.id}`, formData);
      } else {
        await axios.post(`${API}/materials`, formData);
      }
      setOpenDialog(false);
      fetchMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm('Удалить материал?')) return;
    try {
      await axios.delete(`${API}/materials/${id}`);
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">База материалов</h1>
          <p className="text-muted-foreground">Управление материалами и ценами</p>
        </div>
        <Button data-testid="create-material-btn" onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить материал
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="search-materials-input"
              placeholder="Поиск материалов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            data-testid="filter-type-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-sm border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Все типы</option>
            {Object.keys(materialTypeLabels).map(type => (
              <option key={type} value={type}>{materialTypeLabels[type]}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Название</TableHead>
                <TableHead className="font-semibold">Тип</TableHead>
                <TableHead className="font-semibold font-mono">Цена</TableHead>
                <TableHead className="font-semibold">Единица</TableHead>
                <TableHead className="font-semibold">Примечания</TableHead>
                <TableHead className="font-semibold text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Материалов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id} data-testid={`material-row-${material.id}`}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <Badge className={materialTypeColors[material.type]}>
                        {materialTypeLabels[material.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(material.price)}
                    </TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {material.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(material)}
                          data-testid={`edit-material-${material.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMaterial(material.id)}
                          data-testid={`delete-material-${material.id}`}
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Редактировать материал' : 'Новый материал'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                data-testid="material-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Труба 25x25"
              />
            </div>
            <div>
              <Label>Тип материала</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger data-testid="material-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(materialTypeLabels).map(type => (
                    <SelectItem key={type} value={type}>{materialTypeLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Цена</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="unit">Единица</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="м, шт, кг"
                />
              </div>
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
              data-testid="submit-material-btn"
              onClick={saveMaterial}
              className="w-full"
              disabled={!formData.name || formData.price <= 0}
            >
              {editingMaterial ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materials;