import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '../actions';
import { db } from '@/db';
import { user, customer } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    try {
        // Get order details
        const orderData = await getOrderById(orderId);

        if (!orderData) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Get cashier info
        const [cashierInfo] = await db
            .select({
                name: user.name,
            })
            .from(user)
            .where(eq(user.id, orderData.cashierId))
            .limit(1);

        // Generate receipt HTML
        const receiptHtml = generateReceiptHTML(orderData, cashierInfo?.name || 'Unknown');

        // Return HTML response (for simplicity, in production you'd generate PDF)
        return new NextResponse(receiptHtml, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; filename="receipt-${orderData.orderNumber}.html"`,
            },
        });

    } catch (error) {
        console.error('Error generating receipt:', error);
        return NextResponse.json(
            { error: 'Failed to generate receipt' },
            { status: 500 }
        );
    }
}

function generateReceiptHTML(orderData: any, cashierName: string) {
    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(num);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${orderData.orderNumber}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background: white;
            max-width: 400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px dashed #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header p {
            margin: 5px 0;
            font-size: 14px;
        }
        .info {
            margin-bottom: 20px;
            font-size: 12px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .items {
            margin-bottom: 20px;
            border-bottom: 1px dashed #333;
            padding-bottom: 20px;
        }
        .item {
            margin-bottom: 10px;
            font-size: 12px;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        }
        .item-details {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
        }
        .item-price {
            text-align: right;
        }
        .summary {
            margin-bottom: 20px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
        }
        .summary-row.total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #333;
            padding-top: 5px;
        }
        .footer {
            text-align: center;
            font-size: 11px;
            color: #666;
            margin-top: 20px;
        }
        .payment-method {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 12px;
        }
        @media print {
            body {
                padding: 10px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔆 BARBERSHOP</h1>
        <p>Jl. Contoh No. 123, Jakarta</p>
        <p>Telp: (021) 1234-5678</p>
        <p>================================</p>
    </div>

    <div class="info">
        <div class="info-row">
            <span>No. Order:</span>
            <span>${orderData.orderNumber}</span>
        </div>
        <div class="info-row">
            <span>Tanggal:</span>
            <span>${formatDate(orderData.createdAt)}</span>
        </div>
        <div class="info-row">
            <span>Kasir:</span>
            <span>${cashierName}</span>
        </div>
        ${orderData.customerName ? `
        <div class="info-row">
            <span>Pelanggan:</span>
            <span>${orderData.customerName}</span>
        </div>
        ` : ''}
        ${orderData.notes ? `
        <div class="info-row">
            <span>Catatan:</span>
            <span>${orderData.notes}</span>
        </div>
        ` : ''}
    </div>

    <div class="items">
        <div style="font-weight: bold; margin-bottom: 10px; text-align: center;">=== DETAIL PEMBAYARAN ===</div>
        ${orderData.items.map((item: any) => `
        <div class="item">
            <div class="item-header">
                <span>${item.serviceName} ${item.personLabel ? `(${item.personLabel})` : ''}</span>
                <span>${formatCurrency(item.lineTotal)}</span>
            </div>
            <div class="item-details">
                <div>• ${item.employeeName}</div>
                ${item.chairName ? `<div>• Kursi: ${item.chairName}</div>` : ''}
                <div>• ${item.quantity} x ${formatCurrency(item.manualPrice || item.unitPrice)}</div>
                ${item.discount > 0 ? `<div>• Diskon: ${formatCurrency(item.discount)}</div>` : ''}
                ${item.adjustmentReason ? `<div>• ${item.adjustmentReason}</div>` : ''}
            </div>
        </div>
        `).join('')}
    </div>

    <div class="summary">
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(orderData.subtotal)}</span>
        </div>
        ${parseFloat(orderData.totalDiscount) > 0 ? `
        <div class="summary-row">
            <span>Diskon:</span>
            <span>-${formatCurrency(orderData.totalDiscount)}</span>
        </div>
        ` : ''}
        <div class="summary-row total">
            <span>TOTAL:</span>
            <span>${formatCurrency(orderData.grandTotal)}</span>
        </div>
        ${parseFloat(orderData.totalPaid) > 0 ? `
        <div class="summary-row">
            <span>Dibayar:</span>
            <span>${formatCurrency(orderData.totalPaid)}</span>
        </div>
        ` : ''}
        ${parseFloat(orderData.changeAmount) > 0 ? `
        <div class="summary-row">
            <span>Kembali:</span>
            <span>${formatCurrency(orderData.changeAmount)}</span>
        </div>
        ` : ''}
    </div>

    <div class="payment-method">
        <div style="font-weight: bold; margin-bottom: 5px;">METODE PEMBAYARAN:</div>
        <div>Cash</div>
    </div>

    <div class="footer">
        <div>================================</div>
        <div>Terima kasih atas kunjungan Anda</div>
        <div>Barang yang sudah dibeli</div>
        <div>tidak dapat dikembalikan</div>
        <div>================================</div>
        <div style="margin-top: 10px;">
            <div>www.barbershop.com</div>
            <div>IG: @barbershop</div>
        </div>
    </div>

    <script>
        // Auto print when loaded
        window.onload = function() {
            window.print();
        };

        // Close window after printing
        window.onafterprint = function() {
            window.close();
        };
    </script>
</body>
</html>`;
}