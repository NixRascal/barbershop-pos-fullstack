'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Scissors, Clock, DollarSign } from 'lucide-react';

import {
    getServiceCategories,
    type ServiceCategory,
    type ServiceItem
} from '../../pos/api/actions';

// Mock data for services (since we don't have the server actions yet)
const mockServices: ServiceItem[] = [
    {
        id: '1',
        name: 'Potong Rambut Anak',
        code: 'PRA001',
        basePrice: '30000',
        duration: 30,
        categoryName: 'Potong Rambut',
        categoryId: 'cat1',
    },
    {
        id: '2',
        name: 'Potong Rambut Dewasa',
        code: 'PRD001',
        basePrice: '50000',
        duration: 45,
        categoryName: 'Potong Rambut',
        categoryId: 'cat1',
    },
    {
        id: '3',
        name: 'Creambath',
        code: 'CB001',
        basePrice: '60000',
        duration: 45,
        categoryName: 'Perawatan',
        categoryId: 'cat2',
    },
];

// Mock service categories
const mockCategories: ServiceCategory[] = [
    { id: 'cat1', name: 'Potong Rambut', description: 'Layanan potong rambut' },
    { id: 'cat2', name: 'Perawatan', description: 'Layanan perawatan rambut' },
    { id: 'cat3', name: 'Styling', description: 'Layanan styling' },
];

export default function ServicesPage() {
    const [services, setServices] = useState<ServiceItem[]>(mockServices);
    const [categories, setCategories] = useState<ServiceCategory[]>(mockCategories);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        basePrice: '',
        duration: '',
        categoryId: '',
        commissionType: 'PERCENT',
        commissionValue: '',
        isActive: true,
    });

    useEffect(() => {
        // In a real implementation, you'd load data from server actions
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase()) ||
                            service.code.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !selectedCategory || service.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCreateService = () => {
        // Mock creation - in real implementation, call server action
        const newService: ServiceItem = {
            id: Date.now().toString(),
            name: formData.name,
            code: formData.code,
            basePrice: formData.basePrice,
            duration: parseInt(formData.duration),
            categoryName: categories.find(c => c.id === formData.categoryId)?.name || '',
            categoryId: formData.categoryId,
        };

        setServices([...services, newService]);
        setIsCreateModalOpen(false);
        resetForm();
        toast.success('Service created successfully');
    };

    const handleUpdateService = () => {
        if (!selectedService) return;

        // Mock update - in real implementation, call server action
        const updatedServices = services.map(service =>
            service.id === selectedService.id
                ? {
                    ...service,
                    name: formData.name,
                    code: formData.code,
                    basePrice: formData.basePrice,
                    duration: parseInt(formData.duration),
                    categoryId: formData.categoryId,
                    categoryName: categories.find(c => c.id === formData.categoryId)?.name || '',
                }
                : service
        );

        setServices(updatedServices);
        setIsEditModalOpen(false);
        resetForm();
        setSelectedService(null);
        toast.success('Service updated successfully');
    };

    const handleDeleteService = (serviceId: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        // Mock deletion - in real implementation, call server action
        setServices(services.filter(service => service.id !== serviceId));
        toast.success('Service deleted successfully');
    };

    const openEditModal = (service: ServiceItem) => {
        setSelectedService(service);
        setFormData({
            name: service.name,
            code: service.code,
            basePrice: service.basePrice,
            duration: service.duration.toString(),
            categoryId: service.categoryId,
            commissionType: 'PERCENT',
            commissionValue: '',
            isActive: true,
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            basePrice: '',
            duration: '',
            categoryId: '',
            commissionType: 'PERCENT',
            commissionValue: '',
            isActive: true,
        });
    };

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(num);
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Service Management</h1>
                    <p className="text-gray-600">Manage services and pricing</p>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Service</DialogTitle>
                            <DialogDescription>Add a new service to the system</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Service Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Potong Rambut Dewasa"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="code">Service Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., PRD001"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price">Base Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        placeholder="50000"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="45"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="commission-type">Commission Type</Label>
                                    <Select
                                        value={formData.commissionType}
                                        onValueChange={(value: 'PERCENT' | 'FLAT') =>
                                            setFormData({ ...formData, commissionType: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENT">Percentage</SelectItem>
                                            <SelectItem value="FLAT">Flat Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="commission-value">Commission Value</Label>
                                    <Input
                                        id="commission-value"
                                        value={formData.commissionValue}
                                        onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                                        placeholder={formData.commissionType === 'PERCENT' ? '25' : '10000'}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateService}>Create Service</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{service.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary">{service.code}</Badge>
                                        <span className="text-sm">{service.categoryName}</span>
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditModal(service)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteService(service.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Price
                                    </div>
                                    <div className="font-semibold text-green-600">
                                        {formatCurrency(service.basePrice)}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="h-4 w-4 mr-1" />
                                        Duration
                                    </div>
                                    <div className="text-sm">
                                        {service.duration} minutes
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>Update service information</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-name">Service Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-code">Service Code</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-price">Base Price</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    value={formData.basePrice}
                                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                                <Input
                                    id="edit-duration"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-category">Category</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateService}>Update Service</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}