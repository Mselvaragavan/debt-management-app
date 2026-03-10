const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Step 1: Giver Customizes and "Transfers" (Pending Admin Approval)
router.post('/:id/accept', authMiddleware, roleMiddleware(['GIVER']), async (req, res) => {
  const { tenureMonths, repaymentDayOfMonth } = req.body; 
  
  if (!tenureMonths || isNaN(tenureMonths) || tenureMonths < 1) {
    return res.status(400).json({ message: 'Invalid tenure duration' });
  }

  try {
    const request = await req.prisma.loanRequest.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!request || request.status !== 'PENDING') return res.status(404).json({ message: 'Request not found or not pending' });

    // Mark request as GIVER_ACCEPTED, store pending terms, wait for Admin
    const updatedRequest = await req.prisma.loanRequest.update({
      where: { id: request.id },
      data: { 
        status: 'GIVER_ACCEPTED', 
        giverId: req.user.id,
        finalTenureMonths: parseInt(tenureMonths),
        finalRepaymentDay: repaymentDayOfMonth ? parseInt(repaymentDayOfMonth) : 10
      }
    });

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 2: Admin Finalizes the Deal (Transfers funds officially, makes deal ACTIVE)
router.post('/:id/admin-approve-deal', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const request = await req.prisma.loanRequest.findUnique({ where: { id: parseInt(req.params.id) } });
    
    if (!request || request.status !== 'GIVER_ACCEPTED' || !request.giverId) {
      return res.status(400).json({ message: 'Request is not waiting for admin deal approval' });
    }

    // Create the active deal
    const deal = await req.prisma.loanDeal.create({
      data: {
        requestId: request.id,
        giverId: request.giverId,
        receiverId: request.receiverId,
        principal: request.amount,
        interestRate: request.proposedRate,
        tenureMonths: request.finalTenureMonths, 
        repaymentDayOfMonth: request.finalRepaymentDay,
        status: 'ACTIVE'
      }
    });

    // Mark Request as COMPLETED since it's now an active deal
    await req.prisma.loanRequest.update({
      where: { id: request.id },
      data: { status: 'COMPLETED' }
    });

    // Deduct available amount from giver
    await req.prisma.user.update({
      where: { id: request.giverId },
      data: { availableAmount: { decrement: request.amount } }
    });

    res.json(deal);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate Dynamic EMI Schedule
router.get('/:id/schedule', authMiddleware, async (req, res) => {
  try {
    const deal = await req.prisma.loanDeal.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { payments: true }
    });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    if (deal.receiverId !== req.user.id && deal.giverId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Dynamic Logic: Compute EMI mathematically
    const P = deal.principal;
    const R = deal.interestRate / 12 / 100;
    const N = deal.tenureMonths;
    const standardEmi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);

    let remainingPrincipal = P;
    let schedule = [];
    let paymentsMade = deal.payments.reduce((acc, p) => acc + p.amount, 0);
    
    // Calculate precise dates based on dealing startDate and repaymentDayOfMonth
    let currentMonthDate = new Date(deal.startDate);

    for (let month = 1; month <= N && remainingPrincipal > 0; month++) {
      let interestForMonth = remainingPrincipal * R;
      let monthPayment = Math.min(standardEmi, remainingPrincipal + interestForMonth);
      let principalPaid = monthPayment - interestForMonth;

      // Ensure the generated date clamps to the configured repaymentDayOfMonth
      // e.g. if the user chose the 10th. Advance month by 1 for each iteration starting from month 1.
      let targetMonth = currentMonthDate.getMonth() + month;
      let dueDate = new Date(currentMonthDate.getFullYear(), targetMonth, deal.repaymentDayOfMonth);

      // Adjust if extra payments were made affecting current balance
      if (paymentsMade >= monthPayment) {
        paymentsMade -= monthPayment;
        remainingPrincipal -= principalPaid;
        schedule.push({ month, dueDate: dueDate.toISOString(), emi: monthPayment, interest: interestForMonth, principalPaid, balance: remainingPrincipal, status: 'PAID' });
      } else if (paymentsMade > 0) {
        // Partial payment covering this month
        let actualPrincipalPaid = paymentsMade - interestForMonth;
        if (actualPrincipalPaid < 0) actualPrincipalPaid = 0; // deficit
        remainingPrincipal -= actualPrincipalPaid;
        schedule.push({ month, dueDate: dueDate.toISOString(), emi: monthPayment, interest: interestForMonth, principalPaid: actualPrincipalPaid, balance: remainingPrincipal, status: 'PARTIAL' });
        paymentsMade = 0;
      } else {
        remainingPrincipal -= principalPaid;
        schedule.push({ month, dueDate: dueDate.toISOString(), emi: monthPayment, interest: interestForMonth, principalPaid, balance: remainingPrincipal, status: 'PENDING' });
      }
    }

    res.json({ deal, standardEmi, schedule });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin Exhaustive Analytics - All Deals Detailed
router.get('/all', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const deals = await req.prisma.loanDeal.findMany({
      include: { 
        receiver: { select: { name: true, email: true } }, 
        giver: { select: { name: true, email: true } },
        payments: true
      },
      orderBy: { startDate: 'desc' }
    });

    // Enriched deal details with calculated logic on server
    const enrichedDeals = deals.map(deal => {
      const P = deal.principal;
      const R = deal.interestRate / 12 / 100;
      const N = deal.tenureMonths;
      const standardEmi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);

      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;
      
      let remainingPrincipal = P;
      let paymentsMade = deal.payments.reduce((acc, p) => acc + p.amount, 0);
      let totalValuePaid = paymentsMade;

      // Replay the schedule algorithm to separate historical payments into P vs I
      for (let month = 1; month <= N && remainingPrincipal > 0; month++) {
        let interestForMonth = remainingPrincipal * R;
        let monthPayment = Math.min(standardEmi, remainingPrincipal + interestForMonth);
        let principalPaid = monthPayment - interestForMonth;

        if (paymentsMade >= monthPayment) {
          paymentsMade -= monthPayment;
          remainingPrincipal -= principalPaid;
          totalPrincipalPaid += principalPaid;
          totalInterestPaid += interestForMonth;
        } else if (paymentsMade > 0) {
          let actualPrincipalPaid = paymentsMade - interestForMonth;
          if (actualPrincipalPaid < 0) actualPrincipalPaid = 0;
          let actualInterestPaid = Math.min(interestForMonth, paymentsMade);
          
          remainingPrincipal -= actualPrincipalPaid;
          totalPrincipalPaid += actualPrincipalPaid;
          totalInterestPaid += actualInterestPaid;
          paymentsMade = 0;
        }
      }

      return {
        ...deal,
        calculated: {
          totalValuePaid,
          totalPrincipalPaid,
          totalInterestPaid,
          remainingPrincipal: remainingPrincipal < 0.1 ? 0 : remainingPrincipal // float precision fix
        }
      };
    });

    res.json(enrichedDeals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// View My Deals (Giver / Receiver)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'GIVER') whereClause = { giverId: req.user.id };
    else if (req.user.role === 'RECEIVER') whereClause = { receiverId: req.user.id };
    else if (req.user.role === 'ADMIN') return res.status(403).json({ message: 'Use /all instead' });

    const deals = await req.prisma.loanDeal.findMany({
      where: whereClause,
      include: { receiver: { select: { name: true } }, giver: { select: { name: true } }, payments: true }
    });
    res.json(deals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
