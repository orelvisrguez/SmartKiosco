import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Printer, Download, X, Store, Phone, MapPin, FileText, CheckCircle } from 'lucide-react';
import type { BusinessSettings, ReceiptSettings } from '@/lib/api/settings';

export interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  barcode?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  cashReceived?: number;
  change?: number;
  customerName?: string;
  cashierName?: string;
  notes?: string;
}

interface ReceiptTicketProps {
  receiptData: ReceiptData;
  businessSettings: BusinessSettings;
  receiptSettings: ReceiptSettings;
  onClose?: () => void;
  showActions?: boolean;
}

export interface ReceiptTicketRef {
  print: () => void;
}

const ReceiptTicket = forwardRef<ReceiptTicketRef, ReceiptTicketProps>(
  ({ receiptData, businessSettings, receiptSettings, onClose, showActions = true }, ref) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
      if (!printRef.current) return;

      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'width=400,height=600');

      if (!printWindow) {
        alert('Por favor permita las ventanas emergentes para imprimir');
        return;
      }

      const paperWidth = receiptSettings.paperWidth === '58mm' ? '58mm' : '80mm';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo ${receiptData.receiptNumber}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${receiptSettings.paperWidth === '58mm' ? '10px' : '12px'};
              line-height: 1.4;
              width: ${paperWidth};
              padding: 8px;
              background: white;
              color: black;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .receipt-logo {
              max-width: 60px;
              max-height: 60px;
              margin-bottom: 8px;
            }
            .business-name {
              font-weight: bold;
              font-size: ${receiptSettings.paperWidth === '58mm' ? '14px' : '16px'};
              margin-bottom: 4px;
            }
            .receipt-info {
              font-size: ${receiptSettings.paperWidth === '58mm' ? '9px' : '10px'};
              color: #333;
            }
            .receipt-section {
              margin: 8px 0;
              padding: 8px 0;
              border-bottom: 1px dashed #000;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .item-row {
              margin: 4px 0;
            }
            .item-name {
              font-weight: 500;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: ${receiptSettings.paperWidth === '58mm' ? '9px' : '10px'};
              color: #555;
              padding-left: 8px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            .total-section {
              margin-top: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: ${receiptSettings.paperWidth === '58mm' ? '12px' : '14px'};
              margin: 4px 0;
            }
            .payment-info {
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px dashed #000;
            }
            .footer {
              text-align: center;
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px dashed #000;
              font-size: ${receiptSettings.paperWidth === '58mm' ? '9px' : '10px'};
            }
            .footer-message {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .barcode-text {
              font-family: 'Libre Barcode 39', cursive;
              font-size: 28px;
              text-align: center;
              margin: 8px 0;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    useImperativeHandle(ref, () => ({
      print: handlePrint,
    }));

    const formatCurrency = (amount: number) => {
      const currency = businessSettings.currency || 'USD';
      const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
      return `${symbol}${amount.toFixed(2)}`;
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };

    const getPaymentMethodLabel = (method: string) => {
      const labels: Record<string, string> = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transferencia',
      };
      return labels[method] || method;
    };

    return (
      <div className="flex flex-col h-full">
        {/* Actions Bar */}
        {showActions && (
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-700 bg-neutral-800/50">
            <h3 className="text-base sm:text-lg font-semibold text-neutral-50 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Venta Completada
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-neutral-950 rounded-lg hover:bg-primary-400 transition-colors font-medium text-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div
            ref={printRef}
            className={`mx-auto bg-white text-neutral-900 rounded-lg shadow-lg ${
              receiptSettings.paperWidth === '58mm' ? 'max-w-[220px]' : 'max-w-[300px]'
            }`}
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <div className="p-3 sm:p-4">
              {/* Header */}
              <div className="text-center border-b border-dashed border-neutral-300 pb-3 mb-3">
                {receiptSettings.showLogo && businessSettings.logo_url && (
                  <img
                    src={businessSettings.logo_url}
                    alt="Logo"
                    className="receipt-logo mx-auto mb-2 max-w-[60px] max-h-[60px] object-contain"
                  />
                )}
                <h1 className="business-name text-sm sm:text-base font-bold">
                  {businessSettings.name || 'Mi Negocio'}
                </h1>
                {receiptSettings.showRuc && businessSettings.ruc && (
                  <p className="receipt-info text-[10px] sm:text-xs text-neutral-600">
                    RUC: {businessSettings.ruc}
                  </p>
                )}
                {receiptSettings.showAddress && businessSettings.address && (
                  <p className="receipt-info text-[10px] sm:text-xs text-neutral-600">
                    {businessSettings.address}
                  </p>
                )}
                {receiptSettings.showPhone && businessSettings.phone && (
                  <p className="receipt-info text-[10px] sm:text-xs text-neutral-600">
                    Tel: {businessSettings.phone}
                  </p>
                )}
              </div>

              {/* Receipt Info */}
              <div className="border-b border-dashed border-neutral-300 pb-3 mb-3">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-neutral-600">Recibo:</span>
                  <span className="font-bold">{receiptData.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-neutral-600">Fecha:</span>
                  <span>{formatDate(receiptData.date)}</span>
                </div>
                {receiptData.customerName && (
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className="text-neutral-600">Cliente:</span>
                    <span>{receiptData.customerName}</span>
                  </div>
                )}
                {receiptData.cashierName && (
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className="text-neutral-600">Cajero:</span>
                    <span>{receiptData.cashierName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-neutral-300 pb-3 mb-3">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-2 text-neutral-700">
                  <span>PRODUCTO</span>
                  <span>TOTAL</span>
                </div>
                {receiptData.items.map((item, index) => (
                  <div key={index} className="item-row mb-2">
                    <div className="item-name text-[11px] sm:text-xs font-medium">
                      {item.productName}
                    </div>
                    {receiptSettings.showItemCode && item.barcode && (
                      <div className="text-[9px] text-neutral-500">
                        Cod: {item.barcode}
                      </div>
                    )}
                    <div className="item-details flex justify-between text-[10px] sm:text-xs text-neutral-600">
                      <span>
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </span>
                      <span className="font-medium text-neutral-800">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="total-section space-y-1">
                <div className="flex justify-between text-[11px] sm:text-xs">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                {receiptData.discountAmount > 0 && (
                  <div className="flex justify-between text-[11px] sm:text-xs text-success">
                    <span>
                      Descuento
                      {receiptData.discountPercent > 0 && ` (${receiptData.discountPercent}%)`}:
                    </span>
                    <span>-{formatCurrency(receiptData.discountAmount)}</span>
                  </div>
                )}
                {receiptData.taxAmount > 0 && (
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span>IVA ({receiptData.taxRate}%):</span>
                    <span>{formatCurrency(receiptData.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-neutral-300 pt-2 mt-2">
                  <div className="total-row flex justify-between text-sm sm:text-base font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(receiptData.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="payment-info border-t border-dashed border-neutral-300 pt-3 mt-3">
                <div className="flex justify-between text-[11px] sm:text-xs">
                  <span>Método de pago:</span>
                  <span className="font-medium">{getPaymentMethodLabel(receiptData.paymentMethod)}</span>
                </div>
                {receiptData.paymentMethod === 'cash' && receiptData.cashReceived && (
                  <>
                    <div className="flex justify-between text-[11px] sm:text-xs">
                      <span>Recibido:</span>
                      <span>{formatCurrency(receiptData.cashReceived)}</span>
                    </div>
                    {receiptData.change !== undefined && receiptData.change > 0 && (
                      <div className="flex justify-between text-[11px] sm:text-xs font-bold text-primary-600">
                        <span>Cambio:</span>
                        <span>{formatCurrency(receiptData.change)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Notes */}
              {receiptData.notes && (
                <div className="border-t border-dashed border-neutral-300 pt-3 mt-3">
                  <p className="text-[10px] sm:text-xs text-neutral-600">
                    <span className="font-medium">Nota:</span> {receiptData.notes}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="footer text-center border-t border-dashed border-neutral-300 pt-3 mt-3">
                <p className="footer-message text-[11px] sm:text-xs font-bold text-neutral-700">
                  {receiptSettings.footerMessage || '¡Gracias por su compra!'}
                </p>
                <p className="text-[9px] sm:text-[10px] text-neutral-500 mt-1">
                  {businessSettings.email}
                </p>
                <div className="mt-2 pt-2 border-t border-dotted border-neutral-200">
                  <p className="text-[9px] text-neutral-400">
                    {receiptData.receiptNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions - Mobile */}
        {showActions && (
          <div className="sm:hidden p-3 border-t border-neutral-700 bg-neutral-800/50">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-neutral-950 rounded-lg font-semibold"
            >
              <Printer className="w-5 h-5" />
              Imprimir Recibo
            </button>
          </div>
        )}
      </div>
    );
  }
);

ReceiptTicket.displayName = 'ReceiptTicket';

export default ReceiptTicket;
