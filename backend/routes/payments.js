const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Make a payment
router.post('/', authMiddleware, roleMiddleware(['RECEIVER']), async (req, res) => {
  const { dealId, amount, type } = req.body; // type: EMI or EXTRA
  try {
    const deal = await req.prisma.loanDeal.findUnique({ where: { id: parseInt(dealId) } });
    if (!deal || deal.receiverId !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    const payment = await req.prisma.payment.create({
      data: {
        dealId: deal.id,
        amount: parseFloat(amount),
        type: type || 'EMI'
      }
    });

    // Notify the giver
    await req.prisma.notification.create({
      data: {
        userId: deal.giverId,
        message: `Receiver ${req.user.name} has made a payment of ₹${amount}.`
      }
    });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
