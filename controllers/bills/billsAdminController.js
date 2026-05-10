const AppError = require("../../utils/appError");
const asyncWrapper = require("../../middleware/asyncWrapper");
const {
  createProvider,
  updateProvider,
  deleteProvider,
  getProviders,
  countProviders,
  createService,
  updateService,
  deleteService,
  getAllServices,
  countServices,
} = require("../../models/billModel");
const { getAllBills, getBillsByUserId } = require("../../models/billDatailsModel");

// @desc Get All Bills (Admin)
// @route GET /api/v1/bills/admin/history
// @access Private (Admin)
exports.getAllBillsAdmin = asyncWrapper(async (req, res, next) => {
  const bills = await getAllBills();
  res.json({
    success: true,
    data: bills,
  });
});

// @desc Get Bills for a Specific User (Admin)
// @route GET /api/v1/bills/admin/history/:userId
// @access Private (Admin)
exports.getUserBillsAdmin = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const bills = await getBillsByUserId(userId);
  res.json({
    success: true,
    data: bills,
  });
});

// @desc Create a Provider
// @route POST /api/v1/bills/admin/providers
// @access Private (Admin)
exports.addProvider = asyncWrapper(async (req, res, next) => {
  const { name, code, contact_email } = req.body;

  if (!name || !code) {
    return next(AppError.create("Name and code are required", 400, false));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contact_email || !emailRegex.test(contact_email)) {
    return next(AppError.create("A valid contact email is required", 400, false));
  }

  const provider = await createProvider(name, code, contact_email, true);

  res.status(201).json({
    success: true,
    message: "Provider created successfully",
    data: provider,
  });
});

// @desc Update a Provider
// @route PUT /api/v1/bills/admin/providers/:id
// @access Private (Admin)
exports.editProvider = asyncWrapper(async (req, res, next) => {
  
  const { id } = req.params;
  const { name, code, contact_email, is_active } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (contact_email && !emailRegex.test(contact_email)) {
    return next(AppError.create("Invalid contact email format", 400));
  }


  const provider = await updateProvider(id, name, code, contact_email, is_active);
  
  if (!provider) {
    return next(AppError.create("Provider not found", 404));
  }

  res.json({
    success: true,
    message: "Provider updated successfully",
    data: provider,
  });
});

// @desc Delete a Provider
// @route DELETE /api/v1/bills/admin/providers/:id
// @access Private (Admin)
exports.removeProvider = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  await deleteProvider(id);

  res.json({
    success: true,
    message: "Provider deleted successfully",
    data: null,
  });
});

// @desc Get All Providers (Including inactive)
// @route GET /api/v1/bills/admin/providers
// @access Private (Admin)
exports.getAllAdminProviders = asyncWrapper(async (req, res, next) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  const [providers, total] = await Promise.all([
    getProviders({ limit: parseInt(limit), offset, search, activeOnly: false }),
    countProviders({ search, activeOnly: false })
  ]);

  res.json({
    success: true,
    data: providers,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// @desc Create a Service
// @route POST /api/v1/bills/admin/services
// @access Private (Admin)
exports.addService = asyncWrapper(async (req, res, next) => {
  const { provider_id, service_name, category, fee } = req.body;

  if (!provider_id || !service_name) {
    return next(AppError.create("Provider ID and Service Name are required", 400, false));
  }

  const service = await createService(provider_id, service_name, category, fee || 0, true);

  res.status(201).json({
    success: true,
    message: "Service created successfully",
    data: service,
  });
});

// @desc Update a Service
// @route PUT /api/v1/bills/admin/services/:id
// @access Private (Admin)
exports.editService = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { provider_id, service_name, category, fee, is_active } = req.body;

  const service = await updateService(id, provider_id, service_name, category, fee, is_active);

  res.json({
    success: true,
    message: "Service updated successfully",
    data: service,
  });
});

// @desc Delete a Service
// @route DELETE /api/v1/bills/admin/services/:id
// @access Private (Admin)
exports.removeService = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  await deleteService(id);

  res.json({
    success: true,
    message: "Service deleted successfully",
    data: null,
  });
});

// @desc Get All Services (Including inactive)
// @route GET /api/v1/bills/admin/services
// @access Private (Admin)
exports.getAllAdminServices = asyncWrapper(async (req, res, next) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  const [services, total] = await Promise.all([
    getAllServices({ limit: parseInt(limit), offset, search, activeOnly: false }),
    countServices({ search, activeOnly: false })
  ]);

  res.json({
    success: true,
    data: services,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});
