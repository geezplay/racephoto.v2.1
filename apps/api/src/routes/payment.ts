import { Router, RequestHandler } from 'express';
import crypto from 'crypto';
import { ADMIN_FEES, calculateAdminFee, OrderStatus, PaymentMethod, PAYMENT_METHODS } from '@racephoto/shared';
import { snap, coreApi } from '../config/midtrans';
import { Order, OrderItem, Photo, User, Event } from '../models';
import { sequelize } from '../config/db';
import { sendTransactionEmail } from '../services/emailService';

const router = Router();

interface MidtransChargeResponse {
  status_code?: string;
  transaction_status?: string;
  actions?: Array<{ name: string; url: string }>;
  qr_string?: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  expiry_time?: string;
}

const orderItemsOf = (order: Order): OrderItem[] =>
  (order as unknown as { items?: OrderItem[] }).items || [];

// GET /payment
router.get('/', (_req, res) => {
  res.json({
    message: 'Payment API (Midtrans)',
    endpoints: [
      { method: 'POST', path: '/create-payment', description: 'Create Midtrans Snap token' },
      { method: 'POST', path: '/notification', description: 'Handle Midtrans webhook' },
      { method: 'GET', path: '/check-status/:orderId', description: 'Check payment status' },
    ],
  });
});

router.get('/create-payment', (_req, res) => {
  res.json({
    message: 'This endpoint requires POST method',
    method: 'POST',
    body: { orderId: 'number (required)' },
    response: { snap_token: 'string', redirect_url: 'string' },
  });
});

// POST /payment/create-payment  (also exposed as /create-token for compatibility)
const createSnapPayment: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.body as { orderId: number };
    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const grossAmount = Number(order.total_price);
    if (grossAmount < 1) {
      return res.status(400).json({ message: `Total pesanan tidak valid: Rp ${grossAmount.toLocaleString()}` });
    }

    const midtransOrderId = `RACEPHOTO-${order.id}-${Date.now()}`;
    const itemDetails = orderItemsOf(order).map((item) => ({
      id: `photo-${item.photo_id}-v${item.variant || 1}`,
      name: `Foto No. ${item.snap_photo_start_no || 'NA'} V${item.variant || 1}`,
      price: Number(item.price),
      quantity: 1,
    }));

    const itemTotal = itemDetails.reduce((sum, item) => sum + item.price, 0);
    if (itemTotal !== grossAmount) {
      itemDetails.push({ id: 'rounding', name: 'Pembulatan', price: grossAmount - itemTotal, quantity: 1 });
    }

    const email = order.email || '';
    const phone = (order.whatsapp || '').replace(/[^0-9]/g, '');
    const firstName = email ? email.split('@')[0] : 'Customer';
    const notificationUrl = process.env.MIDTRANS_NOTIFICATION_URL || 'https://api.geezplay.site/api/payment/notification';

    snap.apiConfig.set({
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      overrideNotifUrl: notificationUrl,
    });

    const transaction = await snap.createTransaction({
      transaction_details: { order_id: midtransOrderId, gross_amount: grossAmount },
      item_details: itemDetails,
      customer_details: { first_name: firstName, email, phone },
      callbacks: { finish: `${process.env.FRONTEND_URL || 'https://geezplay.site'}/success?order_id=${order.id}` },
      expiry: { unit: 'minutes', duration: 60 },
    });

    order.invoice_number = midtransOrderId;
    order.payment_url = transaction.redirect_url;
    await order.save();

    res.json({
      snap_token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: order.id,
      invoice_number: midtransOrderId,
    });
  } catch (error) {
    const err = error as { ApiResponse?: { status_message?: string } };
    console.error('Create payment error:', error);
    res.status(500).json({ message: err.ApiResponse?.status_message || 'Gagal membuat pembayaran' });
  }
};

router.post('/create-payment', createSnapPayment);
router.post('/create-token', createSnapPayment);

// GET /payment/admin-fee
router.get('/admin-fee', (_req, res) => {
  res.json(ADMIN_FEES);
});

// POST /payment/charge  (Core API: QRIS, GoPay, bank VA, Mandiri)
router.post('/charge', async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body as { orderId: number; paymentMethod: PaymentMethod };
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const method: PaymentMethod = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'qris';

    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const baseAmount = Number(order.total_price);
    const discountAmt = Number(order.discount_amount) || 0;
    const originalSubtotal = baseAmount + discountAmt;
    const adminFee = calculateAdminFee(method, originalSubtotal);
    const grossAmount = baseAmount + adminFee;
    const midtransOrderId = order.invoice_number || `RACEPHOTO-${order.id}-${Date.now()}`;
    if (!order.invoice_number) {
      order.invoice_number = midtransOrderId;
      await order.save();
    }

    const email = order.email || '';
    const phone = (order.whatsapp || '').replace(/[^0-9]/g, '');
    const firstName = email ? email.split('@')[0] : 'Customer';
    const feeLabel = ADMIN_FEES[method].label;

    const isBankVA = ['bni_va', 'bri_va', 'permata_va', 'cimb_va'].includes(method);
    const isMandiri = method === 'mandiri_bill';
    const midtransPaymentType = isBankVA ? 'bank_transfer' : isMandiri ? 'echannel' : method;

    const parameter: Record<string, unknown> = {
      payment_type: midtransPaymentType,
      transaction_details: { order_id: midtransOrderId, gross_amount: grossAmount },
      item_details: [
        { id: 'photo-order', price: originalSubtotal, quantity: 1, name: `Foto Order #${order.id}` },
        ...(discountAmt > 0
          ? [{ id: 'discount', price: -discountAmt, quantity: 1, name: `Diskon ${order.discount_code || ''}` }]
          : []),
        { id: 'admin-fee', price: adminFee, quantity: 1, name: `Biaya Admin ${feeLabel}` },
      ],
      customer_details: { first_name: firstName, email, phone },
    };

    parameter.custom_expiry = isBankVA || isMandiri ? { expiry_duration: 24, unit: 'hour' } : { expiry_duration: 15, unit: 'minute' };

    if (method === 'qris') {
      parameter.qris = { acquirer: 'gopay' };
    } else if (method === 'gopay') {
      parameter.gopay = {
        enable_callback: true,
        callback_url: `${process.env.FRONTEND_URL || 'https://geezplay.site'}/success?order_id=${order.id}&status=success`,
      };
    } else if (isBankVA) {
      parameter.bank_transfer = { bank: method.replace('_va', '') };
    } else if (isMandiri) {
      parameter.echannel = { bill_info1: 'Payment for', bill_info2: `RacePhoto Order #${order.id}` };
    }

    const chargeResponse = (await coreApi.charge(parameter)) as MidtransChargeResponse;

    let qrUrl = '';
    let qrString = '';
    let deeplinkUrl = '';
    let vaNumber = '';
    let bank = '';
    let billerCode = '';
    let billKey = '';

    if (chargeResponse.actions) {
      const generateQr = chargeResponse.actions.find((a) => a.name === 'generate-qr-code');
      if (generateQr) qrUrl = generateQr.url;
      const deeplink = chargeResponse.actions.find((a) => a.name === 'deeplink-redirect');
      if (deeplink) deeplinkUrl = deeplink.url;
    }
    if (chargeResponse.qr_string) qrString = chargeResponse.qr_string;
    if (chargeResponse.va_numbers && chargeResponse.va_numbers.length > 0) {
      vaNumber = chargeResponse.va_numbers[0].va_number;
      bank = chargeResponse.va_numbers[0].bank;
    }
    if (chargeResponse.permata_va_number) {
      vaNumber = chargeResponse.permata_va_number;
      bank = 'permata';
    }
    if (chargeResponse.biller_code) billerCode = chargeResponse.biller_code;
    if (chargeResponse.bill_key) billKey = chargeResponse.bill_key;

    res.json({
      order_id: order.id,
      midtrans_order_id: midtransOrderId,
      gross_amount: grossAmount,
      base_amount: baseAmount,
      admin_fee: adminFee,
      payment_method: method,
      qr_url: qrUrl,
      qr_string: qrString,
      deeplink_url: deeplinkUrl,
      va_number: vaNumber,
      bank,
      biller_code: billerCode,
      bill_key: billKey,
      expiry_time: chargeResponse.expiry_time || null,
      transaction_status: chargeResponse.transaction_status,
    });
  } catch (error) {
    const err = error as { ApiResponse?: { status_message?: string }; message?: string };
    console.error('Payment charge error:', err.message);
    res.status(500).json({ message: err.ApiResponse?.status_message || err.message || 'Gagal membuat pembayaran' });
  }
});

// GET /payment/check-status/:orderId  (also acts as webhook fallback)
router.get('/check-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Photo, as: 'photo', include: [{ model: Event, as: 'event' }] }],
        },
      ],
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'success') return res.json({ status: 'success', order_id: order.id });

    if (order.invoice_number) {
      try {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        const baseUrl = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
        const authString = Buffer.from(`${serverKey}:`).toString('base64');

        const statusResponse = await fetch(`${baseUrl}/v2/${order.invoice_number}/status`, {
          headers: { Accept: 'application/json', Authorization: `Basic ${authString}` },
        });
        const statusData = (await statusResponse.json()) as { transaction_status?: string; fraud_status?: string };

        const transactionStatus = statusData.transaction_status;
        const fraudStatus = statusData.fraud_status;
        let newStatus: OrderStatus = order.status;

        if (transactionStatus === 'capture') newStatus = fraudStatus === 'accept' ? 'success' : 'failed';
        else if (transactionStatus === 'settlement') newStatus = 'success';
        else if (['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus || '')) newStatus = 'failed';

        if (newStatus !== order.status) {
          order.status = newStatus;
          await order.save();

          if (newStatus === 'success') {
            for (const item of orderItemsOf(order)) {
              const ownerId = (item as unknown as { photo?: { event?: { created_by: number | null } } }).photo?.event?.created_by;
              if (ownerId) {
                await User.increment('balance', { by: Number(item.price), where: { id: ownerId } });
              }
            }
            try {
              const fullOrder = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
              if (fullOrder) await sendTransactionEmail(fullOrder, orderItemsOf(fullOrder));
            } catch (emailError) {
              console.error('Failed to send email (non-blocking):', (emailError as Error).message);
            }
          }
        }

        return res.json({ status: newStatus, order_id: order.id });
      } catch (e) {
        console.error('Midtrans check status error:', (e as Error).message);
      }
    }

    res.json({ status: order.status || 'pending', order_id: order.id });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ message: 'Failed to check payment status' });
  }
});

// POST /payment/notification  (Midtrans webhook)
router.post('/notification', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const n = req.body as {
      order_id: string;
      status_code: string;
      gross_amount: string;
      signature_key: string;
      transaction_status?: string;
      fraud_status?: string;
    };

    const serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(n.order_id + n.status_code + n.gross_amount + serverKey)
      .digest('hex');

    if (n.signature_key !== expectedSignature) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const orderIdMatch = n.order_id.match(/RACEPHOTO-(\d+)-/);
    if (!orderIdMatch) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    const realOrderId = orderIdMatch[1];

    const order = await Order.findByPk(realOrderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Photo, as: 'photo', include: [{ model: Event, as: 'event' }] }],
        },
      ],
      transaction: t,
    });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    const transactionStatus = n.transaction_status;
    const fraudStatus = n.fraud_status;
    let newStatus: OrderStatus = order.status;

    if (transactionStatus === 'capture') newStatus = fraudStatus === 'accept' ? 'success' : 'failed';
    else if (transactionStatus === 'settlement') newStatus = 'success';
    else if (transactionStatus === 'pending') newStatus = 'pending';
    else if (['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus || '')) newStatus = 'failed';

    if (newStatus === 'success' && order.status !== 'success') {
      for (const item of orderItemsOf(order)) {
        const ownerId = (item as unknown as { photo?: { event?: { created_by: number | null } } }).photo?.event?.created_by;
        if (ownerId) {
          await User.increment('balance', { by: Number(item.price), where: { id: ownerId }, transaction: t });
        }
      }
    }

    order.status = newStatus;
    await order.save({ transaction: t });
    await t.commit();

    if (newStatus === 'success') {
      try {
        const fullOrder = await Order.findByPk(realOrderId, { include: [{ model: OrderItem, as: 'items' }] });
        if (fullOrder) await sendTransactionEmail(fullOrder, orderItemsOf(fullOrder));
      } catch (emailError) {
        console.error('Failed to send email (non-blocking):', (emailError as Error).message);
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    await t.rollback();
    console.error('Midtrans notification error:', error);
    res.status(500).json({ message: 'Failed to process notification' });
  }
});

// POST /payment/check-status
router.post('/check-status', async (req, res) => {
  try {
    const { merchantOrderId } = req.body as { merchantOrderId?: string };
    if (!merchantOrderId) return res.status(400).json({ message: 'merchantOrderId is required' });
    const statusResponse = await snap.transaction.status(merchantOrderId);
    res.json(statusResponse);
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ message: 'Failed to check status' });
  }
});

export default router;
