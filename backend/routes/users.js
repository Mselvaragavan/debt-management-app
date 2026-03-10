const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, availableAmount: true, preferredRate: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active Givers (Lenders) for receivers
router.get('/givers', authMiddleware, async (req, res) => {
  try {
    const givers = await req.prisma.user.findMany({
      where: { role: 'GIVER', availableAmount: { gt: 0 } },
      select: { id: true, name: true, availableAmount: true, preferredRate: true }
    });
    res.json(givers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Giver preferences (amount & rate)
router.put('/preferences', authMiddleware, async (req, res) => {
  if (req.user.role !== 'GIVER') return res.status(403).json({ message: 'Only givers can set preferences' });
  
  const { availableAmount, preferredRate } = req.body;
  try {
    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { availableAmount: parseFloat(availableAmount), preferredRate: parseFloat(preferredRate) }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
