import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, TrendingUp, CheckCircle, Clock, Database, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, trend, color = 'gray' }) => {
  const colorClasses = {
    gray: 'from-[#7A7A79] to-[#5A5A59]',
    blue: 'from-[#384E84] to-[#2A3B64]',
    black: 'from-[#212121] to-[#111111]',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-gray-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold font-mono">{value}</h3>
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
        <h1 className="text-4xl font-bold tracking-tight mb-2">Панель управления</h1>
        <p className="text-muted-foreground">Обзор производства и заказов</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Всего заказов"
            value={stats.total_orders}
            icon={Package}
            color="gray"
          />
          <StatCard
            title="В работе"
            value={stats.active_orders}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Выполнено"
            value={stats.completed_orders}
            icon={CheckCircle}
            color="gray"
          />
          <StatCard
            title="Выручка"
            value={formatCurrency(stats.total_revenue)}
            icon={TrendingUp}
            color="black"
          />
        </div>
      )}

      <Card className="mt-8 border-gray-300 shadow-sm">
        <CardHeader>
          <CardTitle>Быстрый старт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Добро пожаловать в систему управления производством Factory Hub.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-gray-300 rounded hover:bg-accent/10 hover:border-accent hover:shadow-md transition-all cursor-pointer">
                <Package className="w-8 h-8 mb-2 text-[#384E84]" />
                <h3 className="font-semibold mb-1">Создать заказ</h3>
                <p className="text-sm text-muted-foreground">Добавьте новый заказ в систему</p>
              </div>
              <div className="p-4 border-2 border-gray-300 rounded hover:bg-accent/10 hover:border-accent hover:shadow-md transition-all cursor-pointer">
                <Database className="w-8 h-8 mb-2 text-[#384E84]" />
                <h3 className="font-semibold mb-1">Материалы</h3>
                <p className="text-sm text-muted-foreground">Управление базой материалов</p>
              </div>
              <div className="p-4 border-2 border-gray-300 rounded hover:bg-accent/10 hover:border-accent hover:shadow-md transition-all cursor-pointer">
                <Calendar className="w-8 h-8 mb-2 text-[#384E84]" />
                <h3 className="font-semibold mb-1">Календарь</h3>
                <p className="text-sm text-muted-foreground">Планирование производства</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;