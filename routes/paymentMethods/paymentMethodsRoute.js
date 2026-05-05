const verifyToken = require("../../middleware/verifyToken");
const {
    getAllPaymentMethods,
    addCardMethod,
    addMobileWalletMethod,
    removePaymentMethod,
    setMethodAsDefault
} = require("../../controllers/paymentMethods/paymentMethodsController");
const express = require("express");
const router = express.Router();


router.get("/", verifyToken, getAllPaymentMethods);
router.post("/card", verifyToken, addCardMethod);
router.post("/mobile", verifyToken, addMobileWalletMethod);
router.delete("/:id", verifyToken, removePaymentMethod);
router.patch("/:id/default", verifyToken, setMethodAsDefault);

module.exports = router;