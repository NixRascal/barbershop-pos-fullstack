import { requireCashier } from '@/lib/auth-server';

export default async function CashSessionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Ensure only cashier or admin users can access cash session routes
    await requireCashier();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Cash Management</h1>
                        </div>
                    </div>
                </div>
            </div>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}