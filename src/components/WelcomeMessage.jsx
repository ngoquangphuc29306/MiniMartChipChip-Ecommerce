import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Clock, QrCode, CreditCard, Building2, CheckCircle2, Loader2, Shield } from 'lucide-react';

// Fallback banks in case API fails
const FALLBACK_BANKS = [
  { id: 'vietcombank', code: 'VCB', shortName: 'Vietcombank', name: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png' },
  { id: 'vietinbank', code: 'CTG', shortName: 'VietinBank', name: 'VietinBank', logo: 'https://api.vietqr.io/img/CTG.png' },
  { id: 'bidv', code: 'BIDV', shortName: 'BIDV', name: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { id: 'agribank', code: 'VBA', shortName: 'Agribank', name: 'Agribank', logo: 'https://api.vietqr.io/img/VBA.png' },
  { id: 'mb', code: 'MB', shortName: 'MB Bank', name: 'MB Bank', logo: 'https://api.vietqr.io/img/MB.png' },
  { id: 'techcombank', code: 'TCB', shortName: 'Techcombank', name: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
  { id: 'acb', code: 'ACB', shortName: 'ACB', name: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { id: 'vpbank', code: 'VPB', shortName: 'VPBank', name: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png' },
];

const MockPaymentModal = ({ isOpen, onClose, onSuccess, amount, paymentMethod = 'vnpay', orderId }) => {
  const [step, setStep] = useState('select'); // 'select', 'qr', 'card', 'processing', 'success'
  const [countdown, setCountdown] = useState(15);
  const [selectedBank, setSelectedBank] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
  });

  // Fetch banks from VietQR API
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();
        if (data.code === '00' && data.data) {
          // Get first 16 banks for display
          setBanks(data.data.slice(0, 16));
        } else {
          setBanks(FALLBACK_BANKS);
        }
      } catch (error) {
        console.error('Failed to fetch banks:', error);
        setBanks(FALLBACK_BANKS);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(paymentMethod === 'momo' ? 'qr' : 'select');
      setCountdown(15); // 2 minutes
      setSelectedBank(null);
      setCardForm({ cardNumber: '', cardHolder: '', expiry: '' });
    }
  }, [isOpen, paymentMethod]);

  // Countdown timer for QR step - stops when modal closes
  useEffect(() => {
    if (!isOpen) return; // Stop countdown when modal is closed

    if ((step === 'qr' || step === 'processing') && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && step === 'qr') {
      setStep('processing');
      setCountdown(3);
    } else if (countdown === 0 && step === 'processing') {
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    }
  }, [countdown, step, onSuccess, isOpen]);

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setStep('card');
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    setStep('processing');
    setCountdown(3);
  };

  const handleQRMethod = () => {
    setStep('qr');
    setCountdown(15);
  };

  const formatAmount = (amt) => {
    return new Intl.NumberFormat('vi-VN').format(amt);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && step !== 'processing' && step !== 'success' && onClose?.()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step !== 'select' && step !== 'success' && (
                <button onClick={() => setStep('select')} className="p-1 hover:bg-white/20 rounded-full transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                {paymentMethod === 'momo' ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5">
                    <img src="https://cdn.brandfetch.io/momo.vn/w/512/h/512?c=1idiRamKWOLozA0BjjR" alt="MoMo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5">
                    <img src="https://cdn.brandfetch.io/vnlife.vn/w/512/h/512?c=1idiRamKWOLozA0BjjR" alt="VNPAY" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {step !== 'success' && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Giao dịch hết hạn sau</span>
                <div className="flex gap-1">
                  <span className="bg-white/20 px-2 py-0.5 rounded font-mono">
                    {Math.floor(countdown / 60).toString().padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-mono">
                    {(countdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {step !== 'processing' && step !== 'success' && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Bank Selection Step */}
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
                    Chọn phương thức thanh toán
                  </h2>

                  {/* QR Option */}
                  <button
                    onClick={handleQRMethod}
                    className="w-full flex items-center gap-4 p-4 border-2 border-blue-100 rounded-xl mb-4 hover:border-blue-400 hover:bg-blue-50 transition group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-gray-800 group-hover:text-blue-600">
                        Quét mã QR qua App {paymentMethod === 'momo' ? 'MoMo' : 'VNPAY'}
                      </div>
                      <div className="text-sm text-gray-500">Thanh toán nhanh chóng, an toàn</div>
                    </div>
                    <QrCode className="w-8 h-8 text-gray-300 group-hover:text-blue-400" />
                  </button>

                  {/* Bank Selection */}
                  <div className="border-2 border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <span className="font-bold text-gray-700">Thẻ nội địa và tài khoản ngân hàng</span>
                    </div>
                    {loadingBanks ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <div
                        className="grid grid-cols-4 gap-3 max-h-[150px] overflow-y-auto pr-2"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#f59e0b #f3f4f6'
                        }}
                      >
                        {banks.map((bank) => (
                          <button
                            key={bank.code || bank.id}
                            onClick={() => handleBankSelect(bank)}
                            className="p-1 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition flex flex-col items-center justify-center gap-2 bg-white"
                            title={bank.name || bank.shortName}
                          >
                            <img
                              src={bank.logo}
                              alt={bank.shortName || bank.name}
                              className="w-14 h-14 object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.opacity = '0.3';
                              }}
                            />
                            <span className="text-xs text-gray-600 text-center line-clamp-1 font-medium">
                              {bank.shortName || bank.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Số tiền thanh toán</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatAmount(amount)}<span className="text-sm font-normal text-gray-500">VND</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Mã đơn hàng: {orderId?.slice(0, 8) || 'DEMO'}</div>
                  </div>
                </motion.div>
              )}

              {/* QR Code Step */}
              {step === 'qr' && (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className="flex gap-8">
                    {/* Order Info */}
                    <div className="flex-1 text-left bg-gray-50 rounded-xl p-4">
                      <h3 className="font-bold text-gray-700 mb-4">Thông tin đơn hàng</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500">Số tiền thanh toán</span>
                          <div className="text-xl font-bold text-blue-600">{formatAmount(amount)}<span className="text-xs">VND</span></div>
                        </div>
                        <div>
                          <span className="text-gray-500">Giá trị đơn hàng</span>
                          <div className="font-bold text-blue-600">{formatAmount(amount)}<span className="text-xs">VND</span></div>
                        </div>
                        <div>
                          <span className="text-gray-500">Phí giao dịch</span>
                          <div className="font-bold text-blue-600">0<span className="text-xs">VND</span></div>
                        </div>
                        <div>
                          <span className="text-gray-500">Mã đơn hàng</span>
                          <div className="font-bold">{orderId?.slice(0, 8) || 'DEMO123'}</div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-700 mb-4">
                        Quét mã qua App {paymentMethod === 'momo' ? 'MoMo' : 'VNPAY'}
                      </h3>
                      <div className={`w-48 h-48 mx-auto rounded-xl p-4 ${paymentMethod === 'momo' ? 'bg-pink-50' : 'bg-blue-50'} border-2 ${paymentMethod === 'momo' ? 'border-pink-200' : 'border-blue-200'}`}>
                        {/* Fake QR Code Pattern with Logo */}
                        <div className="w-full h-full bg-white rounded-lg p-2 relative">
                          <div className="grid grid-cols-8 gap-0.5 w-full h-full">
                            {[...Array(64)].map((_, i) => (
                              <div
                                key={i}
                                className={`rounded-sm ${(i + Math.floor(i / 8)) % 3 === 0 ? 'bg-gray-800' : (i + Math.floor(i / 8)) % 2 === 0 ? 'bg-gray-600' : 'bg-white'}`}
                              />
                            ))}
                          </div>
                          {/* Center Logo */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-md p-1`}>
                              <img
                                src={paymentMethod === 'momo'
                                  ? 'https://cdn.brandfetch.io/momo.vn/w/512/h/512?c=1idiRamKWOLozA0BjjR'
                                  : 'https://cdn.brandfetch.io/vnlife.vn/w/512/h/512?c=1idiRamKWOLozA0BjjR'
                                }
                                alt={paymentMethod === 'momo' ? 'MoMo' : 'VNPAY'}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Mở App {paymentMethod === 'momo' ? 'MoMo' : 'VNPAY'} và quét mã QR
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Còn {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} để hoàn tất...
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="mt-6 px-8 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                  >
                    Hủy thanh toán
                  </button>
                </motion.div>
              )}

              {/* Card Payment Step */}
              {step === 'card' && selectedBank && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
                    Thanh toán qua {selectedBank.name}
                  </h2>

                  <div className="flex gap-8">
                    {/* Order Info */}
                    <div className="w-1/3 bg-gray-50 rounded-xl p-4">
                      <h3 className="font-bold text-gray-700 mb-4">Thông tin đơn hàng</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500">Số tiền thanh toán</span>
                          <div className="text-xl font-bold text-blue-600">{formatAmount(amount)}<span className="text-xs">VND</span></div>
                        </div>
                        <div>
                          <span className="text-gray-500">Mã đơn hàng</span>
                          <div className="font-bold">{orderId?.slice(0, 8) || 'DEMO123'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Card Form */}
                    <form onSubmit={handleCardSubmit} className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Số thẻ</label>
                        <input
                          type="text"
                          placeholder="Nhập số thẻ"
                          value={cardForm.cardNumber}
                          onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                          maxLength={19}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tên chủ thẻ</label>
                        <input
                          type="text"
                          placeholder="Nhập tên chủ thẻ (không dấu)"
                          value={cardForm.cardHolder}
                          onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Ngày phát hành</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                          maxLength={5}
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                        >
                          Hủy thanh toán
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold"
                        >
                          Tiếp tục
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Processing Step */}
              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Đang xử lý thanh toán...</h3>
                  <p className="text-gray-500">Vui lòng không tắt trình duyệt</p>
                </motion.div>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h3>
                  <p className="text-gray-500">Số tiền: {formatAmount(amount)} VND</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Giao dịch được bảo mật bởi {paymentMethod === 'momo' ? 'MoMo' : 'VNPAY'}</span>
            </div>
            <div className="text-xs text-gray-400">
              © 2025 Payment
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MockPaymentModal;