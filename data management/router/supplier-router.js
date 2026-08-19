const { Router } = require("express")
const { supplierController } = require("../controller/supplier-controller.js")

const supplierRouter = new Router()

supplierRouter.get("/", supplierController.getSuppliers)
supplierRouter.get("/:supplierid", supplierController.getSupplier)
supplierRouter.post("/", supplierController.addSupplier)
supplierRouter.put("/:supplierid", supplierController.updateSupplier)
supplierRouter.delete("/:supplierid", supplierController.deleteSupplier)

module.exports = { supplierRouter }