
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/customSupabaseClient';

// =============================================
// CHATBOT SERVICE
// =============================================

export const processChatbotMessage = async (userText, history) => {
  try {
    // 1. Try to find products related to the query
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, image, category, description')
      .textSearch('name', userText.split(' ').join(' | '), {
        type: 'websearch',
        config: 'english'
      })
      .limit(3);

    // 2. Construct a response
    let responseText = '';
    let recommendedProducts = products || [];

    if (recommendedProducts.length > 0) {
      responseText = `Mình tìm thấy một số sản phẩm phù hợp với "${userText}" đây ạ:`;
    } else {
      // Fallback generic responses based on keywords
      const lowerText = userText.toLowerCase();
      if (lowerText.includes('xin chào') || lowerText.includes('hi')) {
        responseText = 'Chào bạn! Mình có thể giúp gì cho bạn hôm nay?';
      } else if (lowerText.includes('giá') || lowerText.includes('bao nhiêu')) {
        responseText = 'Giá sản phẩm được niêm yết trực tiếp trên website. Bạn có thể xem chi tiết từng món nhé!';
      } else if (lowerText.includes('ship') || lowerText.includes('giao hàng')) {
        responseText = 'Bên mình giao hàng nhanh trong 2h nội thành và miễn phí ship cho đơn từ 300k ạ.';
      } else if (lowerText.includes('địa chỉ') || lowerText.includes('ở đâu')) {
        responseText = 'Cửa hàng ChipChip nằm tại đường Trưng Nữ Vương, Đà Nẵng ạ.';
      } else {
        responseText = 'Xin lỗi, mình chưa tìm thấy sản phẩm nào khớp với yêu cầu. Bạn thử tìm từ khóa khác xem sao nhé?';
      }
    }

    return {
      text: responseText,
      products: recommendedProducts
    };

  } catch (error) {
    console.error('Chatbot Error:', error);
    return {
      text: 'Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau nhé.',
      products: []
    };
  }
};

// =============================================
// PDF EXPORT - Individual Order Invoice
// =============================================

const addFontToDoc = async (doc) => {
  try {
    // Fetch Roboto Regular font which supports Vietnamese
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error('Failed to fetch font');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        doc.addFileToVFS('Roboto-Regular.ttf', base64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        // Map bold/italic to regular to ensure characters render (avoiding fetching multiple large files)
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'italic');
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading font:', error);
  }
};

export const exportOrderToPDF = async (order) => {
  const doc = new jsPDF();

  // Load custom font for Vietnamese support
  await addFontToDoc(doc);
  doc.setFont('Roboto'); // Set default font

  // Colors
  const primaryColor = [234, 179, 8]; // Yellow
  const textDark = [31, 41, 55];
  const textGray = [107, 114, 128];

  // Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 45, 'F');

  // Company Name
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(24);
  doc.setFont('Roboto', 'bold');
  doc.text('ChipChip Minimart', 15, 20);

  // Invoice Title
  doc.setFontSize(12);
  doc.setFont('Roboto', 'normal');
  doc.text('HÓA ĐƠN BÁN HÀNG', 15, 30);

  // Order ID on the right
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text(`Mã đơn: #${order.id.slice(0, 8).toUpperCase()}`, 195, 20, { align: 'right' });
  doc.text(`Ngày: ${new Date(order.created_at).toLocaleDateString('vi-VN')}`, 195, 28, { align: 'right' });
  doc.text(`Trạng thái: ${getStatusText(order.status)}`, 195, 36, { align: 'right' });

  // Customer Info Section
  let yPos = 55;

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, yPos, 180, 35, 3, 3, 'F');

  doc.setTextColor(...textDark);
  doc.setFontSize(11);
  doc.setFont('Roboto', 'bold');
  doc.text('THÔNG TIN KHÁCH HÀNG', 20, yPos + 8);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textGray);
  doc.text(`Họ tên: ${order.full_name || order.profiles?.full_name || 'Khách vãng lai'}`, 20, yPos + 18);
  doc.text(`SĐT: ${order.phone || order.profiles?.phone || 'Không có'}`, 20, yPos + 26);
  doc.text(`Địa chỉ: ${truncateText(order.address || 'Chưa có địa chỉ', 80)}`, 110, yPos + 18);

  // Payment Method
  const paymentText = order.payment_method === 'vnpay' ? 'VNPAY' :
    order.payment_method === 'momo' ? 'MoMo' : 'COD';
  doc.text(`Thanh toán: ${paymentText}`, 110, yPos + 26);

  yPos += 45;

  // Products Table
  doc.setTextColor(...textDark);
  doc.setFontSize(11);
  doc.setFont('Roboto', 'bold');
  doc.text('CHI TIẾT ĐƠN HÀNG', 20, yPos);

  yPos += 5;

  const tableData = (order.order_items || []).map((item, index) => [
    index + 1,
    item.products?.name || 'Sản phẩm',
    item.quantity,
    formatCurrency(item.price),
    formatCurrency(item.price * item.quantity)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 179, 8],
      textColor: [31, 41, 55],
      fontStyle: 'bold',
      font: 'Roboto', // Use custom font
      halign: 'center'
    },
    bodyStyles: {
      font: 'Roboto' // Use custom font for body
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 70 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 40 }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      font: 'Roboto' // Fallback
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });

  // Summary
  let finalY = doc.lastAutoTable.finalY + 10;

  // Summary Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(110, finalY, 85, 45, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...textGray);
  doc.setFont('Roboto', 'normal');
  doc.text('Tạm tính:', 115, finalY + 12);
  doc.text('Phí vận chuyển:', 115, finalY + 22);

  if (order.voucher_code) {
    doc.text('Voucher:', 115, finalY + 32);
  }

  doc.setTextColor(...textDark);
  doc.setFont('Roboto', 'bold');
  doc.text('TỔNG CỘNG:', 115, finalY + 40);

  // Values aligned right
  const subtotal = (order.order_items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = order.total_price >= 300000 ? 0 : 20000; // Recalculate or use logic consistent with app

  doc.setFont('Roboto', 'normal');
  doc.setTextColor(...textGray);
  doc.text(formatCurrency(subtotal), 190, finalY + 12, { align: 'right' });

  // NOTE: In a real app we should save shipping fee in DB, calculating here is an estimation
  // Using logic: Total = Sub + Ship - Discount. 
  // We don't have discount amount stored directly on order easily accessible without calc, so we display Total directly.

  doc.text(formatCurrency(shippingFee), 190, finalY + 22, { align: 'right' });

  if (order.voucher_code) {
    doc.text(`-${order.voucher_code.split('_')[0]}`, 190, finalY + 32, { align: 'right' });
  }

  doc.setFontSize(12);
  doc.setTextColor(234, 88, 12);
  doc.setFont('Roboto', 'bold');
  doc.text(formatCurrency(order.total_price), 190, finalY + 40, { align: 'right' });

  // Footer
  finalY += 60;
  doc.setFontSize(8);
  doc.setTextColor(...textGray);
  doc.setFont('Roboto', 'italic');
  doc.text('Cảm ơn quý khách đã mua hàng tại ChipChip Minimart!', 105, finalY, { align: 'center' });
  doc.text('Hotline: 0708185432 | Email: chipchiptaphoa@gmail.com', 105, finalY + 6, { align: 'center' });
  doc.text('Địa chỉ: Trưng Nữ Vương, Đà Nẵng, Việt Nam', 105, finalY + 12, { align: 'center' });

  // Save PDF
  doc.save(`ChipChip_DonHang_${order.id.slice(0, 8).toUpperCase()}.pdf`);
};

// =============================================
// EXCEL EXPORT - All Orders Summary
// =============================================

export const exportOrdersToExcel = (orders, filename = 'DanhSachDonHang') => {
  const data = orders.map((order, index) => ({
    'STT': index + 1,
    'Mã đơn': order.id.slice(0, 8).toUpperCase(),
    'Ngày đặt': new Date(order.created_at).toLocaleDateString('vi-VN'),
    'Giờ đặt': new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    'Khách hàng': order.full_name || order.profiles?.full_name || 'Khách vãng lai',
    'SĐT': order.phone || order.profiles?.phone || '',
    'Địa chỉ': order.address || '',
    'Số sản phẩm': order.order_items?.length || 0,
    'Tổng tiền (VNĐ)': order.total_price,
    'Thanh toán': order.payment_method === 'vnpay' ? 'VNPAY' : order.payment_method === 'momo' ? 'MoMo' : 'COD',
    'Voucher': order.voucher_code ? order.voucher_code.split('_')[0] : '',
    'Trạng thái': getStatusText(order.status),
    'Ghi chú': order.note || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 12 },  // Mã đơn
    { wch: 12 },  // Ngày đặt
    { wch: 8 },   // Giờ đặt
    { wch: 20 },  // Khách hàng
    { wch: 12 },  // SĐT
    { wch: 40 },  // Địa chỉ
    { wch: 10 },  // Số SP
    { wch: 15 },  // Tổng tiền
    { wch: 10 },  // Thanh toán
    { wch: 12 },  // Voucher
    { wch: 12 },  // Trạng thái
    { wch: 25 },  // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Đơn hàng');

  // Add summary sheet
  const summaryData = [
    { 'Thống kê': 'Tổng số đơn', 'Giá trị': orders.length },
    { 'Thống kê': 'Đơn hoàn thành', 'Giá trị': orders.filter(o => o.status === 'Completed').length },
    { 'Thống kê': 'Đơn đang xử lý', 'Giá trị': orders.filter(o => o.status === 'Pending').length },
    { 'Thống kê': 'Đơn đang giao', 'Giá trị': orders.filter(o => o.status === 'Shipping').length },
    { 'Thống kê': 'Đơn đã hủy', 'Giá trị': orders.filter(o => o.status === 'Cancelled').length },
    { 'Thống kê': 'Tổng doanh thu (VNĐ)', 'Giá trị': orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total_price, 0) },
    { 'Thống kê': 'Thanh toán COD', 'Giá trị': orders.filter(o => !o.payment_method || o.payment_method === 'cod').length },
    { 'Thống kê': 'Thanh toán VNPAY', 'Giá trị': orders.filter(o => o.payment_method === 'vnpay').length },
    { 'Thống kê': 'Thanh toán MoMo', 'Giá trị': orders.filter(o => o.payment_method === 'momo').length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Thống kê');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// =============================================
// EXCEL EXPORT - Revenue Report
// =============================================

export const exportRevenueToExcel = (monthlyData, weeklyData, orders, year) => {
  const workbook = XLSX.utils.book_new();

  // Monthly Revenue Sheet
  const monthlyRevenue = monthlyData.map((m, index) => ({
    'Tháng': `Tháng ${index + 1}`,
    'Doanh thu (VNĐ)': m.revenue,
    'Số đơn hoàn thành': orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === year && d.getMonth() === index && o.status === 'Completed';
    }).length
  }));

  const monthlySheet = XLSX.utils.json_to_sheet(monthlyRevenue);
  monthlySheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Doanh thu theo tháng');

  // Weekly Revenue Sheet
  const weeklyRevenue = weeklyData.map((w, index) => ({
    'Tuần': `Tuần ${index + 1}`,
    'Ngày bắt đầu': w.name,
    'Doanh thu (VNĐ)': w.revenue
  }));

  const weeklySheet = XLSX.utils.json_to_sheet(weeklyRevenue);
  weeklySheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Doanh thu theo tuần');

  // Summary Sheet
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const completedOrders = orders.filter(o => o.status === 'Completed' && new Date(o.created_at).getFullYear() === year);
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  const summaryData = [
    { 'Chỉ số': `Tổng doanh thu năm ${year}`, 'Giá trị': totalRevenue, 'Đơn vị': 'VNĐ' },
    { 'Chỉ số': 'Tổng đơn hoàn thành', 'Giá trị': completedOrders.length, 'Đơn vị': 'đơn' },
    { 'Chỉ số': 'Giá trị đơn trung bình', 'Giá trị': avgOrderValue, 'Đơn vị': 'VNĐ' },
    { 'Chỉ số': 'Tháng cao nhất', 'Giá trị': getMaxRevenueMonth(monthlyData), 'Đơn vị': '' },
    { 'Chỉ số': 'Doanh thu cao nhất', 'Giá trị': Math.max(...monthlyData.map(m => m.revenue)), 'Đơn vị': 'VNĐ' },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng hợp');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `BaoCaoDoanhThu_${year}.xlsx`);
};

// =============================================
// Helper Functions
// =============================================

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getStatusText = (status) => {
  const statusMap = {
    'Pending': 'Chờ xử lý',
    'Shipping': 'Đang giao',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

const getMaxRevenueMonth = (monthlyData) => {
  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const maxIndex = monthlyData.reduce((maxIdx, m, idx, arr) =>
    m.revenue > arr[maxIdx].revenue ? idx : maxIdx, 0);
  return months[maxIndex];
};
