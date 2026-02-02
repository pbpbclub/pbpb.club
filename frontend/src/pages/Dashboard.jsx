import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, TrendingUp, CheckCircle, Clock, Database, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Breadcrumbs from '@/components/Breadcrumbs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, trend, color = 'gray', onClick }) => {
  const colorClasses = {
    gray: 'from-[#7A7A79] to-[#5A5A59]',
    blue: 'from-[#384E84] to-[#2A3B64]',
    black: 'from-[#212121] to-[#111111]',
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 border-[#DCDCDC] ${onClick ? 'cursor-pointer hover:border-[#384E84]' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-[#7A7A79] uppercase tracking-wider mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-[#212121]">{value}</h3>
            {trend && (
              <p className="text-sm text-[#384E84] mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {trend}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_orders: 0,
    active_orders: 0,
    completed_orders: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API}/statistics`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Панель управления</h1>
        <p className="text-gray-900">Обзор производства и заказов</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384E84]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Всего заказов"
            value={stats.total_orders}
            icon={Package}
            color="gray"
            onClick={() => navigate('/orders')}
          />
          <StatCard
            title="В работе"
            value={stats.active_orders}
            icon={Clock}
            color="blue"
            onClick={() => navigate('/orders?status=production')}
          />
          <StatCard
            title="Выполнено"
            value={stats.completed_orders}
            icon={CheckCircle}
            color="gray"
            onClick={() => navigate('/orders?status=completed')}
          />
          <StatCard
            title="Выручка"
            value={formatCurrency(stats.total_revenue)}
            icon={TrendingUp}
            color="black"
            onClick={() => navigate('/orders')}
          />
        </div>
      )}

      <Card className="mt-8 border-[#DCDCDC] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#212121]">Быстрый старт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-[#7A7A79]">
              Добро пожаловать в систему управления производством Factory Hub.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="p-4 border-2 border-[#DCDCDC] rounded hover:bg-gray-50 hover:border-[#384E84] hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/orders/new')}
                data-testid="quick-create-order"
              >
                <Package className="w-8 h-8 mb-2 text-[#384E84]" />
                <h3 className="font-semibold mb-1 text-[#212121]">Создать заказ</h3>
                <p className="text-sm text-[#7A7A79]">Добавьте новый заказ в систему</p>
              </div>
              <div 
                className="p-4 border-2 border-[#DCDCDC] rounded hover:bg-gray-50 hover:border-[#384E84] hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/materials')}
                data-testid="quick-materials"
              >
                <Database className="w-8 h-8 mb-2 text-[#384E84]" />
                <h3 className="font-semibold mb-1 text-[#212121]">Материалы</h3>
                <p className="text-sm text-[#7A7A79]">Управление базой материалов</p>
              </div>
              <div 
                className="p-4 border-2 border-[#DCDCDC] rounded hover:bg-gray-50 hover:border-[#384E84] hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/calendar')}
                data-testid="quick-calendar"
              >
                <Calendar className="w-8 h-8 mb-2 text-[#384E84]" />
                <h3 className="font-semibold mb-1 text-[#212121]">Календарь</h3>
                <p className="text-sm text-[#7A7A79]">Планирование производства</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;