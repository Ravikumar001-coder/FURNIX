import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Send, Save, Calculator, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { quoteService } from '../../services/quoteService';

const QuoteBuilder = ({ inquiryId, customerName, onSaveSuccess }) => {
  const [items, setItems] = useState([
    { id: Date.now(), name: '', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(18); // Default 18% GST
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingQuoteId, setExistingQuoteId] = useState(null);

  // Load existing quote if any
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const response = await quoteService.getByInquiryId(inquiryId);
        if (response?.data) {
          const q = response.data;
          setExistingQuoteId(q.id);
          setItems(q.items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })));
          setDiscount(q.discount || 0);
          setNotes(q.notes || '');
          // Assuming tax amount is stored, we calculate rate or just set amount
          // For simplicity, we keep 18% or set it from backend if added there
        }
      } catch (error) {
        // No quote yet, fine
      }
    };
    if (inquiryId) fetchExisting();
  }, [inquiryId]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal - discount) * (taxRate / 100);
  }, [subtotal, discount, taxRate]);

  const total = useMemo(() => {
    return subtotal - discount + taxAmount;
  }, [subtotal, discount, taxAmount]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSave = async (status = 'DRAFT') => {
    if (items.some(item => !item.name || item.unitPrice <= 0)) {
      toast.error('Please fill all item names and prices');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        inquiryId,
        items: items.map(({ name, description, quantity, unitPrice }) => ({
          name, description, quantity, unitPrice
        })),
        discount,
        tax: taxAmount,
        notes,
        status
      };

      if (existingQuoteId) {
        await quoteService.update(existingQuoteId, payload);
        if (status === 'SENT') await quoteService.send(existingQuoteId);
      } else {
        const created = await quoteService.create(payload);
        if (status === 'SENT' && created?.data?.id) {
          await quoteService.send(created.data.id);
        }
      }
      
      toast.success(status === 'SENT' ? 'Quote sent to customer!' : 'Quote saved successfully');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      toast.error('Failed to save quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quote Builder</h2>
          <p className="text-sm text-gray-500">Drafting for {customerName}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('SENT')}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Send size={16} />
            Send Quote
          </button>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-4 font-medium w-1/3">Item Details</th>
              <th className="pb-4 font-medium px-4">Quantity</th>
              <th className="pb-4 font-medium px-4">Price (₹)</th>
              <th className="pb-4 font-medium text-right">Amount (₹)</th>
              <th className="pb-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="group">
                <td className="py-4 align-top">
                  <input
                    type="text"
                    placeholder="Item name (e.g., Solid Teak Dining Table)"
                    className="w-full px-0 py-1 text-sm font-medium text-gray-900 border-0 border-b border-transparent focus:ring-0 focus:border-primary-500 placeholder:text-gray-300 transition-colors"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  />
                  <textarea
                    placeholder="Description or specifications..."
                    className="w-full px-0 py-1 text-xs text-gray-500 border-0 focus:ring-0 placeholder:text-gray-300 resize-none overflow-hidden"
                    rows={1}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                </td>
                <td className="py-4 px-4 align-top">
                  <input
                    type="number"
                    min="1"
                    className="w-20 px-2 py-1 text-sm text-gray-700 border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td className="py-4 px-4 align-top">
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      className="w-32 pl-6 pr-2 py-1 text-sm text-gray-700 border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </td>
                <td className="py-4 text-right align-top text-sm font-semibold text-gray-900">
                  ₹{(item.quantity * item.unitPrice).toLocaleString()}
                </td>
                <td className="py-4 pl-4 align-top">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add Item Button */}
        <button
          onClick={addItem}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded hover:bg-primary-50"
        >
          <Plus size={16} />
          Add Line Item
        </button>
      </div>

      {/* Footer / Summary */}
      <div className="bg-gray-50/50 p-8 border-t border-gray-100">
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          {/* Notes */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Admin Notes / Terms
            </label>
            <textarea
              className="w-full p-3 text-sm text-gray-600 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none min-h-[100px] transition-all bg-white"
              placeholder="E.g., 50% advance required, valid for 15 days..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Totals Section */}
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Discount</span>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-gray-400 text-xs">-₹</span>
                <input
                  type="number"
                  className="w-24 pl-7 pr-2 py-1 text-right text-sm text-gray-700 border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span>Tax (GST)</span>
                <input
                  type="number"
                  className="w-12 px-1 text-center text-xs border-b border-gray-300 focus:border-primary-500 outline-none bg-transparent"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
              <span>₹{taxAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-bold text-gray-900">Total Amount</span>
              <span className="text-xl font-bold text-primary-600">
                ₹{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteBuilder;
