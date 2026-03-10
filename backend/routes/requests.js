const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Create a loan request (Receiver only)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'RECEIVER') return res.status(403).json({ message: 'Only receivers can create requests' });
  
  const { amount, proposedRate, giverId, preferredTenureMonths } = req.body;
  try {
    const request = await req.prisma.loanRequest.create({
      data: {
        receiverId: req.user.id,
        amount: parseFloat(amount),
        proposedRate: parseFloat(proposedRate),
        preferredTenureMonths: preferredTenureMonths ? parseInt(preferredTenureMonths) : 12,
        giverId: giverId ? parseInt(giverId) : null,
        status: 'PENDING_ADMIN_APPROVAL' // New Security Default
      }
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin ONLY: Approve Request for the Marketplace
router.post('/:id/admin-approve-request', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const request = await req.prisma.loanRequest.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!request || request.status !== 'PENDING_ADMIN_APPROVAL') {
      return res.status(404).json({ message: 'Request not found or not in pending admin approval state' });
    }

    const updated = await req.prisma.loanRequest.update({
      where: { id: request.id },
      data: { status: 'PENDING' }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Browse requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'GIVER') {
      // Givers ONLY see requests that have passed Admin Approval
      whereClause = { 
        OR: [{ giverId: req.user.id }, { giverId: null }], 
        status: 'PENDING' 
      };
    } else if (req.user.role === 'RECEIVER') {
      // Receivers see their own regardless of status
      whereClause = { receiverId: req.user.id };
    } 
    // Admins see all by default, no whereClause override needed.
    // We will handle the specific Admin Security Queue logic on the frontend by filtering.

    const requests = await req.prisma.loanRequest.findMany({
      where: whereClause,
      include: { receiver: { select: { name: true } }, giver: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
