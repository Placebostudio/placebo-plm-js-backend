const cors = require("cors");
const express = require("express")
const app = express()
const fs = require("fs")
const path = require("path")
require("dotenv").config();

const { productRouter } = require("./data management/router/product-router.js")
const { userRouter } = require("./data management/router/user-router.js")
const { supplierRouter } = require("./data management/router/supplier-router.js")
const { materialRouter } = require("./data management/router/material-router.js")
const { bom_lineRouter } = require("./data management/router/bom_line-router.js")
const { orderRouter } = require("./data management/router/order-router.js")
const { order_additional_costRouter } = require("./data management/router/order_additional_cost-router.js")
const { order_lineRouter } = require("./data management/router/order_line-router.js")
const { audit_logRouter } = require("./data management/router/audit_log-router.js")
const { currencyRouter } = require("./data management/router/currency-router.js")
const { attachmentRouter } = require("./data management/router/attachment-router.js")

const products = require("../placebo-plm-js-backend/test data/fake products.json");

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT: ", err);
});

process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED: ", err);
});

app.use(express.json())

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:5500",
    // "http://localhost:5500",
    // "https://final-project-part-2-frontend.onrender.com"
  ],
  credentials: true
}));

const server = app.listen(process.env.PORT || 5173);

server.on('listening', () => {
    console.log(`Server running on port ${process.env.PORT || 5173}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${process.env.PORT || 5173} is already in use. Kill the conflicting process and restart.`);
    } else {
        console.error('Server error:', err.message);
    }
    process.exit(1);
});

app.use("/api/products", productRouter)
app.use("/api/users", userRouter)
app.use("/api/suppliers", supplierRouter)
app.use("/api/materials", materialRouter)
app.use("/api/bom_lines", bom_lineRouter)
app.use("/api/orders", orderRouter)
app.use("/api/order_additional_costs", order_additional_costRouter)
app.use("/api/order_lines", order_lineRouter)
app.use("/api/audit_logs", audit_logRouter)
app.use("/api/currencies", currencyRouter)
app.use("/api/attachments", attachmentRouter)
