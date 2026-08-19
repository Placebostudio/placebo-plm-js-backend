const { Router } = require("express")
const { orderController } = require("../controller/order-controller.js")

const orderRouter = new Router()

orderRouter.get("/", orderController.getOrders)
orderRouter.get("/:orderid", orderController.getOrder)
orderRouter.post("/", orderController.addOrder)
orderRouter.put("/:orderid", orderController.updateOrder)
orderRouter.delete("/:orderid", orderController.deleteOrder)

module.exports = { orderRouter }