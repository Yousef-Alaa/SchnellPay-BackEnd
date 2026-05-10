const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const AppError = require("../utils/appError");

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Each user gets their own folder: /uploads/kyc/:user_id/
        const dir = path.join(__dirname, `../uploads/kyc/${req.user.id}`);

        // Create the directory if it doesn't exist yet
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },

    filename: (req, file, cb) => {
        // fieldname will be front_image | back_image | selfie_image
        // e.g. front_image-1714300000000.jpg
        const ext      = path.extname(file.originalname).toLowerCase();
        const filename = `${file.fieldname}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});

// ─── File filter ──────────────────────────────────────────────────────────────

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(AppError.create("Only JPEG, PNG, and WEBP images are allowed.", 400, false), false);
    }
};

// ─── Upload instance ──────────────────────────────────────────────────────────

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

/**
 * Middleware that expects exactly 3 fields:
 *   front_image, back_image, selfie_image
 * Each accepts 1 file only.
 */
const kycUpload = upload.fields([
    { name: "front_image",  maxCount: 1 },
    { name: "back_image",   maxCount: 1 },
    { name: "selfie_image", maxCount: 1 },
]);

module.exports = kycUpload;