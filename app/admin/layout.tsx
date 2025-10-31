import { requireAdmin } from '@/lib/auth-server';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Ensure only admin users can access admin routes
    await requireAdmin();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
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