const { Router } = require("express")
const { order_lineController } = require("../controller/order_line-controller.js")

const order_lineRouter = new Router()

order_lineRouter.get("/", order_lineController.getOrder_lines)
order_lineRouter.get("/:orderlineid", order_lineController.getOrder_line)
order_lineRouter.post("/", order_lineController.addOrder_line)
order_lineRouter.put("/:orderlineid", order_lineController.updateOrder_line)
order_lineRouter.delete("/:orderlineid", order_lineController.deleteOrder_line)

module.exports = { order_lineRouter }