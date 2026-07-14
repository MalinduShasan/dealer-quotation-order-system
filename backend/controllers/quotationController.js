const quotationService = require("../services/quotationService");
const { validateQuotationPayload } = require("../validators/quotationValidator");

const handleError = (res, error) =>
  res.status(error.statusCode || 500).json({ message: error.message || "Quotation request failed" });

const listQuotations = async (req, res) => {
  try {
    const data = await quotationService.listQuotations(req.user, req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

const getQuotation = async (req, res) => {
  try {
    const data = await quotationService.getQuotationById(req.user, req.params.id);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

const createQuotation = async (req, res) => {
  try {
    const errors = validateQuotationPayload(req.body);
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: "Quotation validation failed", errors });
    }

    const data = await quotationService.createQuotation(req.user, req.body);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

const updateQuotation = async (req, res) => {
  try {
    const errors = validateQuotationPayload(req.body, { isUpdate: true });
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: "Quotation validation failed", errors });
    }

    const data = await quotationService.updateQuotation(req.user, req.params.id, req.body);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

const createStatusAction = (nextStatus, { defaultNote = "" } = {}) => async (req, res) => {
  try {
    const data = await quotationService.transitionQuotationStatus(
      req.user,
      req.params.id,
      nextStatus,
      req.body?.reason || req.body?.note || "",
      { defaultNote }
    );
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
};

const duplicateQuotation = async (req, res) => {
  try {
    const data = await quotationService.duplicateQuotation(req.user, req.params.id);
    res.status(201).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

const getQuotationHistory = async (req, res) => {
  try {
    const data = await quotationService.getQuotationHistory(req.user, req.params.id);
    res.json({ items: data });
  } catch (error) {
    handleError(res, error);
  }
};

const pdfNotReady = async (req, res) => res.status(501).json({ message: "Quotation PDF generation is not configured yet" });

module.exports = {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  submitQuotation: createStatusAction("pending_approval", { defaultNote: "Quotation submitted for approval" }),
  approveQuotation: createStatusAction("approved", { defaultNote: "Quotation approved" }),
  rejectQuotation: createStatusAction("rejected"),
  sendQuotation: createStatusAction("sent", { defaultNote: "Quotation sent to dealer" }),
  acceptQuotation: createStatusAction("accepted", { defaultNote: "Dealer accepted quotation" }),
  declineQuotation: createStatusAction("rejected"),
  cancelQuotation: createStatusAction("cancelled"),
  duplicateQuotation,
  getQuotationHistory,
  pdfNotReady
};
