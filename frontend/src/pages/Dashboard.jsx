import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, TrendingUp, CheckCircle, Clock, Database, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-cyan-600',
    amber: 'from-amber-500 to-orange-600',
    slate: 'from-slate-500 to-gray-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold font-mono">{value}</h3>
            {trend && (
              <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {trend}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-sm bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
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
            color="slate"
          />
          <StatCard
            title="В работе"
            value={stats.active_orders}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Выполнено"
            value={stats.completed_orders}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Выручка"
            value={formatCurrency(stats.total_revenue)}
            icon={TrendingUp}
            color="blue"
          />
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Быстрый старт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Добро пожаловать в систему управления производством FurnitureOS.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-sm hover:bg-accent transition-colors cursor-pointer">
                <Package className="w-8 h-8 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Создать заказ</h3>
                <p className="text-sm text-muted-foreground">Добавьте новый заказ в систему</p>
              </div>
              <div className="p-4 border border-border rounded-sm hover:bg-accent transition-colors cursor-pointer">
                <Database className="w-8 h-8 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Материалы</h3>
                <p className="text-sm text-muted-foreground">Управление базой материалов</p>
              </div>
              <div className="p-4 border border-border rounded-sm hover:bg-accent transition-colors cursor-pointer">
                <Calendar className="w-8 h-8 mb-2 text-primary" />
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