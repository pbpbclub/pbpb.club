import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Trash2, Edit2, Filter } from 'lucide-react';
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
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const materialTypeLabels = {
  metal: 'Металл',
  wood: 'Дерево',
  fabric: 'Ткань',
  paint: 'Краска',
  other: 'Другое',
};

const sourceLabels = {
  warehouse: 'Из склада',
  purchase: 'Под заказ',
};

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'metal',
    article: '',
    price: 0,
    unit: 'шт',
    source: 'warehouse',
    quantity_available: 0,
    quantity_required: 0,
    location: '',
    supplier: '',
    supplier_contact: '',
    notes: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/materials`);
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingMaterial(null);
    setFormData({ 
      name: '', 
      type: 'metal', 
      article: '',
      price: 0, 
      unit: 'шт', 
      source: 'warehouse',
      quantity_available: 0,
      quantity_required: 0,
      location: '',
      supplier: '',
      supplier_contact: '',
      notes: '' 
    });
    setOpenDialog(true);
  };

  const openEditDialog = (material, e) => {
    if (e) e.stopPropagation();
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      article: material.article || '',
      price: material.price,
      unit: material.unit,
      source: material.source || 'warehouse',
      quantity_available: material.quantity_available || 0,
      quantity_required: material.quantity_required || 0,
      location: material.location || '',
      supplier: material.supplier || '',
      supplier_contact: material.supplier_contact || '',
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

  const deleteMaterial = async (id, e) => {
    if (e) e.stopPropagation();
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
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value) + ' ₽';
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.article && m.article.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || m.type === typeFilter;
    const matchesSource = !sourceFilter || m.source === sourceFilter || (!m.source && sourceFilter === 'warehouse');
    return matchesSearch && matchesType && matchesSource;
  });

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: 'Материалы' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] mb-1">Материалы</h1>
          <p className="text-[#7A7A79]">Управление базой материалов и закупками</p>
        </div>
        <Button 
          data-testid="create-material-btn" 
          onClick={openCreateDialog} 
          className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
        >
          <Plus className="w-4 h-4" />
          Добавить материал
        </Button>
      </div>

      <Card className="mb-6 border-[#DCDCDC] shadow-sm">
        <div className="p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A79]" />
            <Input
              data-testid="search-materials-input"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#DCDCDC]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded border border-[#DCDCDC] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#384E84] focus:ring-opacity-20 focus:border-[#384E84]"
            data-testid="filter-type-select"
          >
            <option value="">Все типы</option>
            {Object.entries(materialTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 rounded border border-[#DCDCDC] bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#384E84] focus:ring-opacity-20 focus:border-[#384E84]"
            data-testid="filter-source-select"
          >
            <option value="">Все источники</option>
            <option value="warehouse">Из склада</option>
            <option value="purchase">Под заказ</option>
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
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Артикул</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Наименование</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Тип</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs">Источник</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right">Цена</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right">Кол-во</TableHead>
                <TableHead className="font-semibold text-[#7A7A79] uppercase text-xs text-right w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[#7A7A79]">
                    Материалов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow
                    key={material.id}
                    data-testid={`material-row-${material.id}`}
                    className="cursor-pointer border-b border-[#DCDCDC]"
                    onClick={(e) => openEditDialog(material, e)}
                  >
                    <TableCell className="text-sm text-[#7A7A79] font-mono">
                      {material.article || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[#212121]">{material.name}</div>
                      {material.supplier && (
                        <div className="text-xs text-[#7A7A79]">Поставщик: {material.supplier}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-[#212121]">
                      {materialTypeLabels[material.type]}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        material.source === 'purchase' 
                          ? 'bg-[#E26A2D] text-white border-[#E26A2D]' 
                          : 'bg-[#384E84] text-white border-[#384E84]'
                      }>
                        {sourceLabels[material.source || 'warehouse']}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right text-[#212121]">
                      {formatCurrency(material.price)}/{material.unit}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      <span className={`font-medium ${
                        material.source === 'purchase' 
                          ? 'text-[#212121]' 
                          : (material.quantity_available || 0) > 0 ? 'text-green-600' : 'text-[#E26A2D]'
                      }`}>
                        {material.source === 'purchase' 
                          ? `${material.quantity_required || 0} ${material.unit}`
                          : `${material.quantity_available || 0} ${material.unit}`
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => openEditDialog(material, e)}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-[#384E84]"
                          data-testid={`edit-material-${material.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => deleteMaterial(material.id, e)}
                          className="h-8 w-8 p-0 text-[#7A7A79] hover:text-red-500"
                          data-testid={`delete-material-${material.id}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#212121]">
              {editingMaterial ? 'Редактировать материал' : 'Новый материал'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial ? 'Измените информацию о материале' : 'Добавьте новый материал в базу'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#212121]">Источник</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger className="border-[#DCDCDC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Из склада</SelectItem>
                    <SelectItem value="purchase">Под заказ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#212121]">Артикул</Label>
                <Input
                  value={formData.article}
                  onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                  placeholder="ART-001"
                  className="border-[#DCDCDC]"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-[#212121]">Название</Label>
              <Input
                data-testid="material-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Лист стальной 4мм"
                className="border-[#DCDCDC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#212121]">Тип материала</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="border-[#DCDCDC]" data-testid="material-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(materialTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#212121]">Единица измерения</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="шт, м, кг"
                  className="border-[#DCDCDC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#212121]">Цена за единицу</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="border-[#DCDCDC]"
                />
              </div>
              {formData.source === 'warehouse' ? (
                <div>
                  <Label className="text-[#212121]">Доступно на складе</Label>
                  <Input
                    type="number"
                    value={formData.quantity_available}
                    onChange={(e) => setFormData({ ...formData, quantity_available: parseFloat(e.target.value) || 0 })}
                    className="border-[#DCDCDC]"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-[#212121]">Требуемое кол-во</Label>
                  <Input
                    type="number"
                    value={formData.quantity_required}
                    onChange={(e) => setFormData({ ...formData, quantity_required: parseFloat(e.target.value) || 0 })}
                    className="border-[#DCDCDC]"
                  />
                </div>
              )}
            </div>

            {formData.source === 'warehouse' && (
              <div>
                <Label className="text-[#212121]">Локация на складе</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Секция A-12"
                  className="border-[#DCDCDC]"
                />
              </div>
            )}

            {formData.source === 'purchase' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#212121]">Поставщик</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="ООО ТехноПром"
                    className="border-[#DCDCDC]"
                  />
                </div>
                <div>
                  <Label className="text-[#212121]">Контакт</Label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                    placeholder="Email или телефон"
                    className="border-[#DCDCDC]"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-[#212121]">Примечания</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация"
                className="border-[#DCDCDC]"
              />
            </div>

            <Button
              data-testid="submit-material-btn"
              onClick={saveMaterial}
              className="w-full bg-[#384E84] hover:bg-[#2d3e6a]"
              disabled={!formData.name || formData.price <= 0}
            >
              {editingMaterial ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materials;
