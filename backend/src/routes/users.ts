import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/authorize';
import { UserModel } from '../models/User';

// /api/users router (admin only for now)
export const usersRouter = Router();

// GET /api/users
// Query params: page (default 1), limit (default 20, max 100), search (email substring), role
usersRouter.get('/', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const search = (req.query.search as string)?.trim();
    const role = (req.query.role as string)?.trim();

    const filter: any = {};
    if (search) {
      // Case-insensitive partial match on email
      filter.email = { $regex: search, $options: 'i' };
    }
    if (role) {
      filter.role = role;
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select({ email: 1, role: 1, createdAt: 1 })
        .lean()
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Error listing users:', error);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// GET /api/users/stats - counts per role
usersRouter.get('/stats', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const agg = await UserModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const roleCounts: Record<string, number> = {};
    for (const r of agg) {
      roleCounts[r._id] = r.count;
    }

    res.json({
      success: true,
      roles: roleCounts,
      total: Object.values(roleCounts).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get user stats' });
  }
});

export default usersRouter;