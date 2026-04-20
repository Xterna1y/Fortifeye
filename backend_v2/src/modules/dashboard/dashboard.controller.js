import * as dashboardService from "./dashboard.service.js";

export const getDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData(req.params.userId);
    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
