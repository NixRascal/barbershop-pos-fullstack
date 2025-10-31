'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    Users,
    ShoppingCart,
    Calendar,
    Download,
    Scissors,
    Trophy,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Target
} from 'lucide-react';

// Mock data for demonstration
const mockKPIData = {
    todayRevenue: 2500000,
    todayTransactions: 45,
    averageTransaction: 55556,
    monthlyGrowth: 12.5,
    activeEmployees: 4,
    topServices: [
        { name: 'Potong Rambut Dewasa', revenue: 1500000, transactions: 30 },
        { name: 'Creambath', revenue: 600000, transactions: 10 },
        { name: 'Potong Rambut Anak', revenue: 400000, transactions: 5 },
    ],
    employeePerformance: [
        { name: 'Andi Pratama', revenue: 1200000, transactions: 15, commission: 300000 },
        { name: 'Budi Santoso', revenue: 800000, transactions: 12, commission: 200000 },
        { name: 'Chandra Wijaya', revenue: 500000, transactions: 10, commission: 125000 },
        { name: 'Dedi Kurniawan', revenue: 300000, transactions: 8, commission: 45000 },
    ],
    monthlyTrend: [
        { month: 'Jan', revenue: 45000000, transactions: 680 },
        { month: 'Feb', revenue: 52000000, transactions: 750 },
        { month: 'Mar', revenue: 48000000, transactions: 720 },
        { month: 'Apr', revenue: 61000000, transactions: 890 },
        { month: 'May', revenue: 58000000, transactions: 850 },
        { month: 'Jun', revenue: 62000000, transactions: 920 },
    ],
    paymentMethods: [
        { name: 'Cash', value: 65, color: '#10b981' },
        { name: 'QRIS', value: 20, color: '#3b82f6' },
        { name: 'E-Wallet', value: 10, color: '#f59e0b' },
        { name: 'Debit', value: 5, color: '#8b5cf6' },
    ],
};

export default function StakeholderDashboard() {
    const [timeRange, setTimeRange] = useState('today');
    const [isLoading, setIsLoading] = useState(false);

    const [kpiData, setKpiData] = useState(mockKPIData);

    useEffect(() => {
        // In a real implementation, fetch data based on timeRange
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, [timeRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatCompactCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `Rp${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `Rp${(amount / 1000).toFixed(0)}K`;
        }
        return `Rp${amount}`;
    };

    const exportReport = (format: 'csv' | 'pdf') => {
        // Mock export functionality
        console.log(`Exporting report as ${format.toUpperCase()}...`);
        // In a real implementation, this would trigger a download
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Business Dashboard</h1>
                    <p className="text-gray-600">Real-time insights into your barbershop performance</p>
                </div>
                <div className="flex gap-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => exportReport('csv')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => exportReport('pdf')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactCurrency(kpiData.todayRevenue)}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
                            +12.5% from yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.todayTransactions}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
                            +8 from yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpiData.averageTransaction)}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
                            -5.2% from yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.activeEmployees}</div>
                        <p className="text-xs text-muted-foreground">
                            4 of 5 employees active
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly revenue and transaction volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={kpiData.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'Revenue' ? formatCurrency(Number(value)) : value,
                                        name
                                    ]}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Revenue"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="transactions"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Transactions"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Distribution of payment types today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={kpiData.paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {kpiData.paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Services */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                            Top Services Today
                        </CardTitle>
                        <CardDescription>Best performing services by revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {kpiData.topServices.map((service, index) => (
                                <div key={service.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{service.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {service.transactions} transactions
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{formatCurrency(service.revenue)}</div>
                                        <div className="text-sm text-gray-600">
                                            {formatCurrency(service.revenue / service.transactions)} avg
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Employee Performance
                        </CardTitle>
                        <CardDescription>Revenue and commissions by employee</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {kpiData.employeePerformance.map((employee) => (
                                <div key={employee.name} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{employee.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {employee.transactions} transactions
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(employee.revenue)}</div>
                                            <div className="text-sm text-green-600">
                                                Commission: {formatCurrency(employee.commission)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${(employee.revenue / Math.max(...kpiData.employeePerformance.map(e => e.revenue))) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            <span>Daily Report</span>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                            <Scissors className="h-6 w-6" />
                            <span>Service Analytics</span>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                            <Users className="h-6 w-6" />
                            <span>Staff Performance</span>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                            <Clock className="h-6 w-6" />
                            <span>Peak Hours</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}