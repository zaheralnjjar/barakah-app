export const printFinancialReport = (
    financeData: any,
    totalBalanceARS: number,
    dailyLimitARS: number,
    todayExpense: number
) => {
    const reportDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Clean and modern HTML template for printing
    let html = `
    <html dir="rtl">
            <head>
                <title>التقرير المالي - ${reportDate}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; margin: 0; background-color: #fff; color: #1f2937; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                    .header h1 { margin: 0; color: #111827; font-size: 28px; }
                    .header h2 { margin: 10px 0 0; color: #10b981; font-size: 18px; font-weight: normal; }
                    .header .date { margin-top: 5px; color: #6b7280; font-size: 14px; }
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
                    .summary-card { padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: center; }
                    .summary-card.balance { background: #ecfdf5; border-color: #d1fae5; }
                    .summary-card.expense { background: #fff1f2; border-color: #ffe4e6; }
                    
                    .label { font-size: 14px; color: #4b5563; margin-bottom: 5px; }
                    .value { font-size: 24px; font-weight: bold; color: #111827; direction: ltr; display: inline-block; }
                    .currency { font-size: 12px; color: #6b7280; margin-top: 2px; }

                    h3 { font-size: 18px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-top: 0; }

                    .transactions-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    .transactions-table th { text-align: right; padding: 10px; background: #f3f4f6; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
                    .transactions-table td { padding: 10px; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
                    .transactions-table tr:last-child td { border-bottom: none; }
                    
                    .amount { font-weight: 600; direction: ltr; text-align: left; }
                    .amount.income { color: #059669; }
                    .amount.expense { color: #dc2626; }
                    
                    .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                    
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                        .summary-card { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌟 نظام بركة لإدارة الحياة</h1>
                    <h2>التقرير المالي</h2>
                    <div class="date">${reportDate}</div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card balance">
                        <div class="label">الرصيد الحالي</div>
                        <div class="value">${totalBalanceARS.toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">إجمالي الديون</div>
                        <div class="value">${(financeData?.total_debt || 0).toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">الحد اليومي المتاح</div>
                        <div class="value">${dailyLimitARS.toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                    <div class="summary-card expense">
                        <div class="label">مصروف اليوم</div>
                        <div class="value">${todayExpense.toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                </div>

                <div class="transactions">
                    <h3>📊 آخر المعاملات</h3>
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>الوصف</th>
                                <th>الفئة</th>
                                <th>التاريخ</th>
                                <th style="text-align: left;">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    // Add recent transactions
    const pendingExpenses = financeData?.pending_expenses || [];
    // Sort by timestamp desc and take last 10
    const recentTx = [...pendingExpenses]
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    recentTx.forEach((tx: any) => {
        html += `
        <tr>
            <td>${tx.description || '-'}</td>
            <td>${tx.category || '-'}</td>
            <td>${new Date(tx.timestamp).toLocaleDateString('ar-EG')}</td>
            <td class="amount ${tx.type === 'income' ? 'income' : 'expense'}">
                ${tx.amount.toLocaleString()} ${tx.currency}
            </td>
        </tr>
        `;
    });

    html += `
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    تم إنشاء هذا التقرير تلقائياً بواسطة تطبيق البركة
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
};
