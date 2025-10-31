'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    User,
    Scissors,
    Clock,
    DollarSign,
    CreditCard,
    Smartphone,
    BanknoteIcon,
    Building,
    CheckCircle,
    Edit
} from 'lucide-react';

import {
    getServiceCategories,
    getAllServices,
    getActiveEmployees,
    searchCustomers,
    getActiveChairs,
    createOrder,
    createCustomer,
    processPayment,
    type ServiceItem,
    type Employee,
    type Customer,
    type Chair,
    type CartItem
} from './api/actions';

export default function POSPage() {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [chairs, setChairs] = useState<Chair[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal states
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPriceAdjustmentModalOpen, setIsPriceAdjustmentModalOpen] = useState(false);

    // Form states
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [selectedChair, setSelectedChair] = useState<string>('');
    const [personLabel, setPersonLabel] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Price adjustment states
    const [adjustingItem, setAdjustingItem] = useState<CartItem | null>(null);
    const [manualPrice, setManualPrice] = useState<string>('');
    const [adjustmentReason, setAdjustmentReason] = useState<string>('');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [approvalCode, setApprovalCode] = useState('');

    // New customer form
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        type: 'REGULAR',
        notes: ''
    });

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [splitPayments, setSplitPayments] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (customerSearch.length >= 2) {
            searchCustomers(customerSearch).then(setSearchResults);
        } else {
            setSearchResults([]);
        }
    }, [customerSearch]);

    // Check if price adjustment requires approval
    useEffect(() => {
        if (adjustingItem && manualPrice) {
            const newPrice = parseFloat(manualPrice);
            const tolerancePercent = 10; // 10% tolerance from settings
            const toleranceAmount = adjustingItem.unitPrice * (tolerancePercent / 100);
            const priceDifference = Math.abs(newPrice - adjustingItem.unitPrice);
            const needsApproval = priceDifference > toleranceAmount;
            setRequiresApproval(needsApproval);
        }
    }, [manualPrice, adjustingItem]);

    const loadData = async () => {
        try {
            const [servicesData, categoriesData, employeesData, chairsData] = await Promise.all([
                getAllServices(),
                getServiceCategories(),
                getActiveEmployees(),
                getActiveChairs(),
            ]);

            setServices(servicesData);
            setCategories(categoriesData);
            setEmployees(employeesData);
            setChairs(chairsData);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = () => {
        if (!selectedService || !selectedEmployee) {
            toast.error('Please select service and employee');
            return;
        }

        const cartItem: CartItem = {
            id: `cart-${Date.now()}`,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            serviceCode: selectedService.code,
            unitPrice: parseFloat(selectedService.basePrice),
            manualPrice: null,
            adjustmentReason: null,
            quantity,
            discount: 0,
            employeeId: selectedEmployee,
            employeeName: employees.find(e => e.id === selectedEmployee)?.name || '',
            chairId: selectedChair || null,
            personLabel: personLabel || null,
            lineTotal: parseFloat(selectedService.basePrice) * quantity,
        };

        setCart([...cart, cartItem]);

        // Reset form
        setSelectedService(null);
        setSelectedEmployee('');
        setSelectedChair('');
        setPersonLabel('');
        setQuantity(1);
        setIsItemModalOpen(false);
        toast.success('Item added to cart');
    };

    const removeFromCart = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
        setCart(cart.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, ...updates };
                // Recalculate line total
                updated.lineTotal = ((updated.manualPrice || updated.unitPrice) * updated.quantity) - updated.discount;
                return updated;
            }
            return item;
        }));
    };

    const getCartTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
        const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
        const grandTotal = subtotal - totalDiscount;
        return { subtotal, totalDiscount, grandTotal };
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
        setSearchResults([]);
        setIsCustomerModalOpen(false);
    };

    const handleCreateCustomer = async () => {
        try {
            if (!newCustomer.name || !newCustomer.phone) {
                toast.error('Name and phone are required');
                return;
            }

            const customer = await createCustomer(newCustomer);
            handleCustomerSelect(customer);
            setNewCustomer({ name: '', phone: '', type: 'REGULAR', notes: '' });
            toast.success('Customer created successfully');
        } catch (error) {
            toast.error('Failed to create customer');
        }
    };

    const openPriceAdjustment = (item: CartItem) => {
        setAdjustingItem(item);
        setManualPrice(item.manualPrice?.toString() || item.unitPrice.toString());
        setAdjustmentReason(item.adjustmentReason || '');
        setRequiresApproval(false);
        setApprovalCode('');
        setIsPriceAdjustmentModalOpen(true);
    };

    const handlePriceAdjustment = () => {
        if (!adjustingItem || !manualPrice || !adjustmentReason) {
            toast.error('Please fill all required fields');
            return;
        }

        const newPrice = parseFloat(manualPrice);
        const tolerancePercent = 10; // 10% tolerance from settings
        const toleranceAmount = adjustingItem.unitPrice * (tolerancePercent / 100);
        const priceDifference = Math.abs(newPrice - adjustingItem.unitPrice);

        // Check if adjustment requires approval
        const needsApproval = priceDifference > toleranceAmount;
        setRequiresApproval(needsApproval);

        if (needsApproval && !approvalCode) {
            toast.error('Admin approval required for this adjustment');
            return;
        }

        // Update cart item
        updateCartItem(adjustingItem.id, {
            manualPrice: newPrice,
            adjustmentReason,
        });

        // Reset modal
        setIsPriceAdjustmentModalOpen(false);
        setAdjustingItem(null);
        setManualPrice('');
        setAdjustmentReason('');
        setApprovalCode('');
        setRequiresApproval(false);

        toast.success('Price adjusted successfully');
    };

    const processPayment = async () => {
        const { grandTotal } = getCartTotals();

        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        const paymentAmountNum = parseFloat(paymentAmount) || grandTotal;

        if (paymentMethod === 'CASH' && paymentAmountNum < grandTotal) {
            toast.error('Payment amount is insufficient');
            return;
        }

        setIsProcessing(true);
        try {
            // First, create the order
            const orderData = {
                customerId: selectedCustomer?.id,
                items: cart.map(item => ({
                    serviceId: item.serviceId,
                    employeeId: item.employeeId,
                    chairId: item.chairId,
                    personLabel: item.personLabel,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    manualPrice: item.manualPrice,
                    adjustmentReason: item.adjustmentReason,
                    discount: item.discount,
                })),
                notes,
            };

            const orderResult = await createOrder(orderData);

            // Then process the payment
            const paymentResult = await processPayment({
                orderId: orderResult.order.id,
                method: paymentMethod as any,
                amount: paymentAmountNum,
                referenceNumber: paymentMethod !== 'CASH' ? `REF${Date.now()}` : undefined,
            });

            toast.success('Payment processed successfully');

            // Generate receipt URL
            const receiptUrl = `/api/pos/receipt?orderId=${orderResult.order.id}`;

            // Reset cart
            setCart([]);
            setSelectedCustomer(null);
            setCustomerSearch('');
            setNotes('');
            setPaymentAmount('');
            setIsPaymentModalOpen(false);

            // Open receipt in new window
            window.open(receiptUrl, '_blank');

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'CASH': return <BanknoteIcon className="h-4 w-4" />;
            case 'QRIS': return <Smartphone className="h-4 w-4" />;
            case 'DEBIT': return <CreditCard className="h-4 w-4" />;
            case 'EWALLET': return <Smartphone className="h-4 w-4" />;
            case 'TRANSFER': return <Building className="h-4 w-4" />;
            default: return <DollarSign className="h-4 w-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    const { subtotal, totalDiscount, grandTotal } = getCartTotals();

    return (
        <div className="flex h-full">
            {/* Left Side - Services */}
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Services</h2>
                        <p className="text-gray-600">Select services to add to cart</p>
                    </div>
                    <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Quick Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Service to Cart</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div>
                                    <Label htmlFor="service">Service</Label>
                                    <Select
                                        value={selectedService?.id || ''}
                                        onValueChange={(value) => {
                                            const service = services.find(s => s.id === value);
                                            setSelectedService(service || null);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select service" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name} - {formatCurrency(service.unitPrice)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="employee">Employee</Label>
                                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id}>
                                                    {employee.name} ({employee.level})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="chair">Chair (Optional)</Label>
                                    <Select value={selectedChair} onValueChange={setSelectedChair}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select chair" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {chairs.map((chair) => (
                                                <SelectItem key={chair.id} value={chair.id}>
                                                    {chair.name} - {chair.location}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="personLabel">Person Label (Optional)</Label>
                                    <Input
                                        id="personLabel"
                                        value={personLabel}
                                        onChange={(e) => setPersonLabel(e.target.value)}
                                        placeholder="e.g., Anak 1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <Button onClick={addToCart} className="w-full">
                                    Add to Cart
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All Services</TabsTrigger>
                        {categories.slice(0, 3).map((category) => (
                            <TabsTrigger key={category.id} value={category.id}>
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="all" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((service) => (
                                <Card
                                    key={service.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => {
                                        setSelectedService(service);
                                        setIsItemModalOpen(true);
                                    }}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                                <p className="text-sm text-gray-600">{service.categoryName}</p>
                                            </div>
                                            <Badge variant="secondary">{service.serviceCode}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {service.duration}min
                                            </div>
                                            <div className="text-lg font-bold text-green-600">
                                                {formatCurrency(service.unitPrice)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {categories.map((category) => (
                        <TabsContent key={category.id} value={category.id} className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {services
                                    .filter(service => service.categoryId === category.id)
                                    .map((service) => (
                                        <Card
                                            key={service.id}
                                            className="cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => {
                                                setSelectedService(service);
                                                setIsItemModalOpen(true);
                                            }}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">{service.name}</CardTitle>
                                                        <p className="text-sm text-gray-600">{service.categoryName}</p>
                                                    </div>
                                                    <Badge variant="secondary">{service.serviceCode}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="h-4 w-4 mr-1" />
                                                        {service.duration}min
                                                    </div>
                                                    <div className="text-lg font-bold text-green-600">
                                                        {formatCurrency(service.unitPrice)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Right Side - Cart */}
            <div className="w-96 border-l bg-white p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>

                    {/* Customer Selection */}
                    <div className="mb-4">
                        <Label className="text-sm font-medium">Customer</Label>
                        <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start mt-1">
                                    {selectedCustomer ? (
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2" />
                                            {selectedCustomer.name}
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2" />
                                            Select Customer
                                        </div>
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Select Customer</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div>
                                        <Label htmlFor="search">Search Customer</Label>
                                        <Input
                                            id="search"
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            placeholder="Search by name or phone..."
                                        />
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto">
                                            {searchResults.map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                                                    onClick={() => handleCustomerSelect(customer)}
                                                >
                                                    <div className="font-medium">{customer.name}</div>
                                                    <div className="text-sm text-gray-600">{customer.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Separator />

                                    <div>
                                        <Label className="text-sm font-medium">Create New Customer</Label>
                                        <div className="grid gap-2 mt-2">
                                            <Input
                                                placeholder="Name"
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Phone"
                                                value={newCustomer.phone}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                            />
                                            <Button onClick={handleCreateCustomer}>
                                                Create Customer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <Card key={item.id} className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.serviceName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {item.employeeName} {item.personLabel && `(${item.personLabel})`}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openPriceAdjustment(item)}
                                                title="Adjust Price"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(item.lineTotal)}</div>
                                            {item.manualPrice && (
                                                <div className="text-xs text-orange-600">
                                                    {formatCurrency(item.manualPrice)} each
                                                    {item.adjustmentReason && (
                                                        <div className="text-xs text-gray-500">{item.adjustmentReason}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Order Notes */}
                    <div className="mb-4">
                        <Label htmlFor="notes">Order Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add order notes..."
                            className="mt-1"
                        />
                    </div>

                    {/* Order Summary */}
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(totalDiscount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Checkout Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={cart.length === 0}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Checkout
                    </Button>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payment</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="text-center mb-4">
                            <div className="text-2xl font-bold">{formatCurrency(grandTotal)}</div>
                            <p className="text-gray-600">Total Amount</p>
                        </div>

                        <div>
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">
                                        <div className="flex items-center">
                                            <BanknoteIcon className="h-4 w-4 mr-2" />
                                            Cash
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="QRIS">
                                        <div className="flex items-center">
                                            <Smartphone className="h-4 w-4 mr-2" />
                                            QRIS
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="DEBIT">
                                        <div className="flex items-center">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Debit Card
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EWALLET">
                                        <div className="flex items-center">
                                            <Smartphone className="h-4 w-4 mr-2" />
                                            E-Wallet
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="TRANSFER">
                                        <div className="flex items-center">
                                            <Building className="h-4 w-4 mr-2" />
                                            Bank Transfer
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentMethod === 'CASH' && (
                            <div>
                                <Label htmlFor="payment-amount">
                                    Cash Amount
                                    {parseFloat(paymentAmount) > grandTotal && (
                                        <span className="text-green-600 ml-2">
                                            Change: {formatCurrency(parseFloat(paymentAmount) - grandTotal)}
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    id="payment-amount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter cash amount"
                                />
                            </div>
                        )}

                        <Button
                            onClick={processPayment}
                            className="w-full"
                            disabled={isProcessing || (paymentMethod === 'CASH' && (!paymentAmount || parseFloat(paymentAmount) < grandTotal))}
                        >
                            {isProcessing ? 'Processing...' : `Pay ${getPaymentIcon(paymentMethod)} ${paymentMethod}`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price Adjustment Modal */}
            <Dialog open={isPriceAdjustmentModalOpen} onOpenChange={setIsPriceAdjustmentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Price</DialogTitle>
                    </DialogHeader>
                    {adjustingItem && (
                        <div className="grid gap-4 py-4">
                            <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium">{adjustingItem.serviceName}</h4>
                                <p className="text-sm text-gray-600">Original price: {formatCurrency(adjustingItem.unitPrice)}</p>
                            </div>

                            <div>
                                <Label htmlFor="manual-price">New Price</Label>
                                <Input
                                    id="manual-price"
                                    type="number"
                                    value={manualPrice}
                                    onChange={(e) => setManualPrice(e.target.value)}
                                    placeholder="Enter new price"
                                />
                                {manualPrice && (
                                    <div className="text-sm mt-1">
                                        {parseFloat(manualPrice) > adjustingItem.unitPrice ? (
                                            <span className="text-green-600">
                                                +{formatCurrency(parseFloat(manualPrice) - adjustingItem.unitPrice)}
                                            </span>
                                        ) : (
                                            <span className="text-red-600">
                                                -{formatCurrency(adjustingItem.unitPrice - parseFloat(manualPrice))}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="adjustment-reason">Reason for Adjustment</Label>
                                <Textarea
                                    id="adjustment-reason"
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="Please provide a reason for this price adjustment..."
                                    className="mt-1"
                                />
                            </div>

                            {manualPrice && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                                    <div className="flex items-center text-sm">
                                        {requiresApproval ? (
                                            <>
                                                <div className="text-yellow-800">
                                                    ⚠️ This adjustment requires admin approval
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-green-800">
                                                ✓ This adjustment is within tolerance limits
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {requiresApproval && (
                                <div>
                                    <Label htmlFor="approval-code">Admin Approval Code</Label>
                                    <Input
                                        id="approval-code"
                                        type="password"
                                        value={approvalCode}
                                        onChange={(e) => setApprovalCode(e.target.value)}
                                        placeholder="Enter admin approval code"
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPriceAdjustmentModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePriceAdjustment}
                                    className="flex-1"
                                    disabled={!manualPrice || !adjustmentReason || (requiresApproval && !approvalCode)}
                                >
                                    Apply Adjustment
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}