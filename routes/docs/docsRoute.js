const express      = require("express");
const router       = express.Router();
const swaggerUi    = require("swagger-ui-express");
const swaggerSpec  = require("../../docs/swagger");

const swaggerUiOptions = {
  customSiteTitle: "SchnellPay API Docs",
  customCss: `
    .topbar { background-color: #1a1a2e; }
    .topbar-wrapper img { content: url(''); }
    .swagger-ui .info .title { color: #e94560; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: "none",
  },
};

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Raw JSON spec endpoint (useful for Postman/Insomnia import)
router.get("/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

module.exports = router;
