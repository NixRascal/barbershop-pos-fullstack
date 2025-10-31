import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    Settings,
    DollarSign,
    Calendar,
    FileText,
    BarChart3,
    Scissors,
    Shield,
    Eye
} from 'lucide-react';

export default function AdminDashboard() {
    const adminModules = [
        {
            title: 'User Management',
            description: 'Manage system users, roles, and permissions',
            href: '/admin/users',
            icon: Users,
            color: 'bg-blue-500',
        },
        {
            title: 'Service Management',
            description: 'Manage services, categories, and pricing',
            href: '/admin/services',
            icon: Scissors,
            color: 'bg-green-500',
        },
        {
            title: 'Employee Management',
            description: 'Manage employee information and levels',
            href: '/admin/employees',
            icon: Shield,
            color: 'bg-purple-500',
        },
        {
            title: 'Customer Management',
            description: 'Manage customer database and information',
            href: '/admin/customers',
            icon: Users,
            color: 'bg-orange-500',
        },
        {
            title: 'Cash Sessions',
            description: 'Monitor and manage cash register sessions',
            href: '/admin/cash-sessions',
            icon: DollarSign,
            color: 'bg-yellow-500',
        },
        {
            title: 'Commission Rules',
            description: 'Configure commission calculation rules',
            href: '/admin/commissions',
            icon: Settings,
            color: 'bg-pink-500',
        },
        {
            title: 'Shift Management',
            description: 'Manage work shifts and schedules',
            href: '/admin/shifts',
            icon: Calendar,
            color: 'bg-indigo-500',
        },
        {
            title: 'Reports & Analytics',
            description: 'View business reports and analytics',
            href: '/admin/reports',
            icon: BarChart3,
            color: 'bg-red-500',
        },
        {
            title: 'Activity Log',
            description: 'Monitor system activities and audit logs',
            href: '/admin/activity-log',
            icon: Eye,
            color: 'bg-gray-500',
        },
    ];

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Manage your barbershop business operations and settings
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminModules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <Card key={module.title} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <div className={`p-3 rounded-lg ${module.color}`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{module.title}</CardTitle>
                                    </div>
                                </div>
                                <CardDescription className="mt-2">
                                    {module.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={module.href}>
                                    <Button variant="outline" className="w-full">
                                        Manage {module.title.split(' ')[0]}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Stats */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">
                                +2 from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Services</CardTitle>
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">10</div>
                            <p className="text-xs text-muted-foreground">
                                All active
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Employees</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5</div>
                            <p className="text-xs text-muted-foreground">
                                3 active today
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp 1.2M</div>
                            <p className="text-xs text-muted-foreground">
                                +15% from yesterday
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}