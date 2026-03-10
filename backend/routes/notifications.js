const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Get My Notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await req.prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as Read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await req.prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
