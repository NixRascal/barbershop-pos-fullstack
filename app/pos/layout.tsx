import { requireCashier } from '@/lib/auth-server';

export default async function POSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Ensure only cashier or admin users can access POS routes
    await requireCashier();

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Point of Sale</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                Cashier: {/* User name will be added here */}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}