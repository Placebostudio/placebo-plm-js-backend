const { Router } = require("express")
const { productController } = require("../controller/product-controller.js")

const productRouter = new Router()

productRouter.get("/", productController.getProducts)
productRouter.get("/:productid", productController.getProduct)
productRouter.post("/", productController.addProduct)
productRouter.put("/:productid", productController.updateProduct)
productRouter.delete("/:productid", productController.deleteProduct)

module.exports = { productRouter }