'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    Calendar,
    User,
    Cash,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';

import {
    getActiveCashSession,
    getCashSessions,
    getShifts,
    openCashSession,
    closeCashSession,
    addCashLedgerEntry,
    getCashLedgerEntries,
    getCashSessionSummary,
    type CashSessionData,
    type CashLedgerEntry,
    type CashSessionSummary
} from './api/actions';

export default function CashSessionPage() {
    const [activeSession, setActiveSession] = useState<CashSessionData | null>(null);
    const [sessions, setSessions] = useState<CashSessionData[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<CashLedgerEntry[]>([]);
    const [sessionSummary, setSessionSummary] = useState<CashSessionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

    // Form states
    const [openSessionForm, setOpenSessionForm] = useState({
        shiftId: '',
        openingAmount: '',
        notes: '',
    });

    const [closeSessionForm, setCloseSessionForm] = useState({
        sessionId: '',
        countedCash: '',
        notes: '',
    });

    const [ledgerForm, setLedgerForm] = useState({
        type: 'IN' as 'IN' | 'OUT',
        reason: '',
        amount: '',
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [activeSessionData, sessionsData, shiftsData] = await Promise.all([
                getActiveCashSession(),
                getCashSessions({ page: 1, limit: 10 }),
                getShifts(),
            ]);

            setActiveSession(activeSessionData);
            setSessions(sessionsData.sessions);
            setShifts(shiftsData);
            setPagination(sessionsData.pagination);

            // Load ledger entries and summary if there's an active session
            if (activeSessionData) {
                const [ledgerData, summaryData] = await Promise.all([
                    getCashLedgerEntries(activeSessionData.id),
                    getCashSessionSummary(activeSessionData.id),
                ]);
                setLedgerEntries(ledgerData);
                setSessionSummary(summaryData);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenSession = async () => {
        try {
            if (!openSessionForm.openingAmount) {
                toast.error('Opening amount is required');
                return;
            }

            await openCashSession({
                shiftId: openSessionForm.shiftId || undefined,
                openingAmount: parseFloat(openSessionForm.openingAmount),
                notes: openSessionForm.notes || undefined,
            });

            toast.success('Cash session opened successfully');
            setIsOpenSessionModalOpen(false);
            setOpenSessionForm({ shiftId: '', openingAmount: '', notes: '' });
            loadData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to open cash session');
        }
    };

    const handleCloseSession = async () => {
        try {
            if (!closeSessionForm.countedCash) {
                toast.error('Counted cash amount is required');
                return;
            }

            await closeCashSession({
                sessionId: closeSessionForm.sessionId,
                countedCash: parseFloat(closeSessionForm.countedCash),
                notes: closeSessionForm.notes || undefined,
            });

            toast.success('Cash session closed successfully');
            setIsCloseSessionModalOpen(false);
            setCloseSessionForm({ sessionId: '', countedCash: '', notes: '' });
            loadData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to close cash session');
        }
    };

    const handleAddLedgerEntry = async () => {
        try {
            if (!activeSession || !ledgerForm.reason || !ledgerForm.amount) {
                toast.error('Please fill all required fields');
                return;
            }

            await addCashLedgerEntry({
                cashSessionId: activeSession.id,
                type: ledgerForm.type,
                reason: ledgerForm.reason,
                amount: parseFloat(ledgerForm.amount),
            });

            toast.success('Ledger entry added successfully');
            setIsLedgerModalOpen(false);
            setLedgerForm({ type: 'IN', reason: '', amount: '' });
            loadData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add ledger entry');
        }
    };

    const openCloseSessionModal = () => {
        if (activeSession) {
            setCloseSessionForm({
                sessionId: activeSession.id,
                countedCash: '',
                notes: activeSession.notes || '',
            });
            setIsCloseSessionModalOpen(true);
        }
    };

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(num);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getVarianceColor = (variance: string) => {
        const varianceNum = parseFloat(variance);
        if (varianceNum > 0) return 'text-green-600';
        if (varianceNum < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Cash Sessions</h1>
                    <p className="text-gray-600">Manage cash register sessions and transactions</p>
                </div>
                {!activeSession ? (
                    <Dialog open={isOpenSessionModalOpen} onOpenChange={setIsOpenSessionModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Open Cash Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Open Cash Session</DialogTitle>
                                <DialogDescription>
                                    Start a new cash register session
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div>
                                    <Label htmlFor="shift">Shift (Optional)</Label>
                                    <Select
                                        value={openSessionForm.shiftId}
                                        onValueChange={(value) => setOpenSessionForm({ ...openSessionForm, shiftId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shift" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shifts.map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id}>
                                                    {shift.name} ({shift.startTime} - {shift.endTime})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="opening-amount">Opening Amount</Label>
                                    <Input
                                        id="opening-amount"
                                        type="number"
                                        value={openSessionForm.openingAmount}
                                        onChange={(e) => setOpenSessionForm({ ...openSessionForm, openingAmount: e.target.value })}
                                        placeholder="Enter opening cash amount"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="opening-notes">Notes</Label>
                                    <Textarea
                                        id="opening-notes"
                                        value={openSessionForm.notes}
                                        onChange={(e) => setOpenSessionForm({ ...openSessionForm, notes: e.target.value })}
                                        placeholder="Add session notes..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleOpenSession}>Open Session</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <div className="flex gap-2">
                        <Dialog open={isLedgerModalOpen} onOpenChange={setIsLedgerModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Cash Movement
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Cash Movement</DialogTitle>
                                    <DialogDescription>
                                        Record cash in or cash out transactions
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div>
                                        <Label htmlFor="movement-type">Type</Label>
                                        <Select
                                            value={ledgerForm.type}
                                            onValueChange={(value: 'IN' | 'OUT') => setLedgerForm({ ...ledgerForm, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IN">
                                                    <div className="flex items-center">
                                                        <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                                                        Cash In
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="OUT">
                                                    <div className="flex items-center">
                                                        <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                                                        Cash Out
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="movement-amount">Amount</Label>
                                        <Input
                                            id="movement-amount"
                                            type="number"
                                            value={ledgerForm.amount}
                                            onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })}
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="movement-reason">Reason</Label>
                                        <Textarea
                                            id="movement-reason"
                                            value={ledgerForm.reason}
                                            onChange={(e) => setLedgerForm({ ...ledgerForm, reason: e.target.value })}
                                            placeholder="Enter reason for cash movement..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddLedgerEntry}>Add Entry</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button onClick={openCloseSessionModal} variant="destructive">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Close Session
                        </Button>
                    </div>
                )}
            </div>

            {/* Active Session Summary */}
            {activeSession && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Session Status</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">Active</div>
                            <p className="text-xs text-muted-foreground">
                                Opened {formatDateTime(activeSession.openedAt)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Opening Amount</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(activeSession.openingAmount)}</div>
                            <p className="text-xs text-muted-foreground">
                                {activeSession.shiftName || 'No shift assigned'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(sessionSummary?.totalSales || '0')}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                From cash payments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expected Cash</CardTitle>
                            <Cash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(sessionSummary?.expectedCash || activeSession.openingAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Opening + Sales + Movements
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Cash Ledger Entries */}
            {activeSession && ledgerEntries.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Cash Ledger Entries
                        </CardTitle>
                        <CardDescription>
                            Recent cash movements in this session
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerEntries.slice(0, 5).map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            <Badge
                                                variant={entry.type === 'IN' ? 'default' : 'destructive'}
                                                className="flex items-center gap-1 w-fit"
                                            >
                                                {entry.type === 'IN' ? (
                                                    <TrendingUp className="h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3" />
                                                )}
                                                {entry.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{entry.reason}</TableCell>
                                        <TableCell className={entry.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                                            {entry.type === 'IN' ? '+' : '-'}{formatCurrency(entry.amount)}
                                        </TableCell>
                                        <TableCell>{entry.createdByName}</TableCell>
                                        <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Session History */}
            <Card>
                <CardHeader>
                    <CardTitle>Session History</CardTitle>
                    <CardDescription>
                        Previous cash register sessions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Opened By</TableHead>
                                <TableHead>Shift</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Opening</TableHead>
                                <TableHead>Expected</TableHead>
                                <TableHead>Counted</TableHead>
                                <TableHead>Variance</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...(activeSession ? [activeSession] : []), ...sessions].map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-mono text-sm">
                                        {session.id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>{session.openedByName}</TableCell>
                                    <TableCell>{session.shiftName || '-'}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div>{formatDateTime(session.openedAt)}</div>
                                            {session.closedAt && (
                                                <div className="text-gray-500">
                                                    to {formatDateTime(session.closedAt)}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatCurrency(session.openingAmount)}</TableCell>
                                    <TableCell>
                                        {session.expectedCash
                                            ? formatCurrency(session.expectedCash)
                                            : session.isActive
                                                ? formatCurrency(sessionSummary?.expectedCash || '0')
                                                : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {session.countedCash ? formatCurrency(session.countedCash) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {session.variance ? (
                                            <span className={`font-medium ${getVarianceColor(session.variance)}`}>
                                                {parseFloat(session.variance) >= 0 ? '+' : ''}
                                                {formatCurrency(session.variance)}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={session.isActive ? 'default' : 'secondary'}
                                            className="flex items-center gap-1 w-fit"
                                        >
                                            {session.isActive ? (
                                                <>
                                                    <Clock className="h-3 w-3" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-3 w-3" />
                                                    Closed
                                                </>
                                            )}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Close Session Modal */}
            <Dialog open={isCloseSessionModalOpen} onOpenChange={setIsCloseSessionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Cash Session</DialogTitle>
                        <DialogDescription>
                            Complete the cash session and count the physical cash
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {sessionSummary && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Session Summary</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Opening Amount:</span>
                                        <span>{formatCurrency(activeSession?.openingAmount || '0')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cash Sales:</span>
                                        <span>{formatCurrency(sessionSummary.totalSales)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cash In:</span>
                                        <span>{formatCurrency(sessionSummary.cashIn)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cash Out:</span>
                                        <span>{formatCurrency(sessionSummary.cashOut)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-medium">
                                        <span>Expected Cash:</span>
                                        <span>{formatCurrency(sessionSummary.expectedCash)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <Label htmlFor="counted-cash">Counted Cash</Label>
                            <Input
                                id="counted-cash"
                                type="number"
                                value={closeSessionForm.countedCash}
                                onChange={(e) => setCloseSessionForm({ ...closeSessionForm, countedCash: e.target.value })}
                                placeholder="Enter counted cash amount"
                            />
                            {sessionSummary && closeSessionForm.countedCash && (
                                <div className="text-sm mt-1">
                                    {parseFloat(closeSessionForm.countedCash) > parseFloat(sessionSummary.expectedCash) ? (
                                        <span className="text-green-600">
                                            Surplus: {formatCurrency(parseFloat(closeSessionForm.countedCash) - parseFloat(sessionSummary.expectedCash))}
                                        </span>
                                    ) : (
                                        <span className="text-red-600">
                                            Shortage: {formatCurrency(parseFloat(sessionSummary.expectedCash) - parseFloat(closeSessionForm.countedCash))}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="closing-notes">Closing Notes</Label>
                            <Textarea
                                id="closing-notes"
                                value={closeSessionForm.notes}
                                onChange={(e) => setCloseSessionForm({ ...closeSessionForm, notes: e.target.value })}
                                placeholder="Add closing notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCloseSessionModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCloseSession}>
                            Close Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}