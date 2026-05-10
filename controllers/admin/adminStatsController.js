const asyncWrapper = require("../../middleware/asyncWrapper");
const adminModel = require("../../models/adminModel");

const getAdminStatsController = asyncWrapper(async (req, res, next) => {
  const [stats, weeklyGrowth, userGrowth, recentUsers] = await Promise.all([
    adminModel.getDashboardStats(),
    adminModel.getWeeklyGrowth(),
    adminModel.getUserGrowth(),
    adminModel.getRecentRegistrations(5)
  ]);

  // Format chart data
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = days.map(day => {
    const txDay = weeklyGrowth.find(g => g.day === day) || { tx: 0, volume: 0 };
    const userDay = userGrowth.find(g => g.day === day) || { users: 0 };
    return {
      day,
      users: userDay.users,
      tx: txDay.tx,
      volume: txDay.volume
    };
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers: stats.totalUsers,
        totalVolume: stats.totalVolume,
        newUsersThisWeek: stats.newUsersThisWeek,
        pendingTransactions: stats.pendingTransactions,
        activeUsers: stats.activeUsers
      },
      chartData,
      recentUsers
    }
  });
});

module.exports = {
  getAdminStatsController
};
