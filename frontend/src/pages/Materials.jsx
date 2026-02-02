import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Trash2, Package, ShoppingCart, Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, warehouse, purchase
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

  const openCreateDialog = (source = 'warehouse') => {
    setEditingMaterial(null);
    setFormData({ 
      name: '', 
      type: 'metal', 
      article: '',
      price: 0, 
      unit: 'шт', 
      source: source,
      quantity_available: 0,
      quantity_required: 0,
      location: '',
      supplier: '',
      supplier_contact: '',
      notes: '' 
    });
    setOpenDialog(true);
  };

  const openEditDialog = (material) => {
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
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value) + ' ₽';
  };

  // Filter materials by tab and search
  const warehouseMaterials = materials.filter(m => 
    (m.source === 'warehouse' || !m.source) &&
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (m.article && m.article.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const purchaseMaterials = materials.filter(m => 
    m.source === 'purchase' &&
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (m.article && m.article.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredMaterials = activeTab === 'warehouse' ? warehouseMaterials :
                           activeTab === 'purchase' ? purchaseMaterials :
                           [...warehouseMaterials, ...purchaseMaterials];

  const tabs = [
    { id: 'all', label: 'Все', count: materials.length },
    { id: 'warehouse', label: 'Из склада', count: warehouseMaterials.length },
    { id: 'purchase', label: 'Под заказ', count: purchaseMaterials.length },
  ];

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: 'Материалы' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] mb-1">Материалы и Закупки</h1>
          <p className="text-[#7A7A79]">Управление складом и закупками материалов</p>
        </div>
        <Button 
          data-testid="create-material-btn" 
          onClick={() => openCreateDialog(activeTab === 'purchase' ? 'purchase' : 'warehouse')} 
          className="gap-2 bg-[#384E84] hover:bg-[#2d3e6a]"
        >
          <Plus className="w-4 h-4" />
          Добавить позицию
        </Button>
      </div>

      {/* Tabs and Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'bg-white text-[#212121] shadow-sm' 
                  : 'text-[#7A7A79] hover:text-[#212121]'}`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7A79]" />
          <Input
            data-testid="search-materials-input"
            placeholder="Поиск по артикулу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#DCDCDC]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384E84]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Warehouse Section */}
          {(activeTab === 'all' || activeTab === 'warehouse') && warehouseMaterials.length > 0 && (
            <Card className="border-[#DCDCDC]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-[#212121]">
                  <Package className="w-5 h-5 text-[#384E84]" />
                  Из склада (В наличии)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-[#DCDCDC]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#7A7A79] uppercase">Артикул</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#7A7A79] uppercase">Наименование</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#7A7A79] uppercase">Кол-во (Треб.)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#7A7A79] uppercase">Доступно</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#7A7A79] uppercase">Локация</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#7A7A79] uppercase">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseMaterials.map((material) => (
                      <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50" data-testid={`material-row-${material.id}`}>
                        <td className="px-4 py-3 text-sm text-[#7A7A79] font-mono">
                          {material.article || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#212121]">{material.name}</div>
                          <div className="text-xs text-[#7A7A79]">{materialTypeLabels[material.type]}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[#212121]">
                          {material.quantity_required || 0} {material.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${
                            (material.quantity_available || 0) > (material.quantity_required || 0) 
                              ? 'text-green-600' 
                              : 'text-[#E26A2D]'
                          }`}>
                            {material.quantity_available || 0} {material.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#7A7A79]">
                          {material.location || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(material)}
                              className="text-[#384E84] hover:text-[#2d3e6a]"
                            >
                              Изменить
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMaterial(material.id)}
                              data-testid={`delete-material-${material.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Purchase Section */}
          {(activeTab === 'all' || activeTab === 'purchase') && purchaseMaterials.length > 0 && (
            <Card className="border-[#DCDCDC]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-[#212121]">
                  <ShoppingCart className="w-5 h-5 text-[#E26A2D]" />
                  Под заказ (Закупка)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-[#DCDCDC]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#7A7A79] uppercase">Артикул</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#7A7A79] uppercase">Наименование</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#7A7A79] uppercase">Кол-во</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#7A7A79] uppercase">Оценка стоимости</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#7A7A79] uppercase">Поставщик и связь</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#7A7A79] uppercase w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseMaterials.map((material) => (
                      <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50" data-testid={`material-row-${material.id}`}>
                        <td className="px-4 py-3 text-sm text-[#7A7A79] font-mono">
                          {material.article || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#212121]">{material.name}</div>
                          {material.notes && (
                            <div className="text-xs text-[#E26A2D]">{material.notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[#212121]">
                          {material.quantity_required || 1} {material.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[#212121]">
                          {formatCurrency(material.price * (material.quantity_required || 1))}
                        </td>
                        <td className="px-4 py-3">
                          {material.supplier ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#384E84] text-white text-xs flex items-center justify-center font-medium">
                                  {material.supplier.charAt(0)}
                                </div>
                                <span className="text-sm text-[#212121]">{material.supplier}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 ml-8">
                                <button className="p-1 text-[#7A7A79] hover:text-[#384E84]">
                                  <Mail className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-[#7A7A79] hover:text-[#384E84]">
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-[#7A7A79] hover:text-[#384E84]">
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[#7A7A79]">Не указан</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMaterial(material.id)}
                            data-testid={`delete-material-${material.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 border-t border-[#DCDCDC] flex items-center justify-between">
                  <span className="text-sm text-[#7A7A79]">
                    Показано {purchaseMaterials.length} из {purchaseMaterials.length} позиций под заказ
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openCreateDialog('purchase')}
                    className="text-[#384E84] gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить позицию
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {filteredMaterials.length === 0 && (
            <Card className="border-[#DCDCDC]">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-[#DCDCDC]" />
                <p className="text-[#7A7A79]">Материалов не найдено</p>
                <Button 
                  onClick={() => openCreateDialog()} 
                  className="mt-4 bg-[#384E84] hover:bg-[#2d3e6a]"
                >
                  Добавить первый материал
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#212121]">
              {editingMaterial ? 'Редактировать материал' : 'Новый материал'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial ? 'Измените информацию о материале' : 'Добавьте новый материал'}
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
                <Label className="text-[#212121]">Единица</Label>
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
