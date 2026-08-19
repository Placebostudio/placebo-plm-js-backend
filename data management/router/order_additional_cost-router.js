const { Router } = require("express")
const { order_additional_costController } = require("../controller/order_additional_cost-controller.js")

const order_additional_costRouter = new Router()

order_additional_costRouter.get("/", order_additional_costController.getOrder_additional_costs)
order_additional_costRouter.get("/:orderadditionalcostid", order_additional_costController.getOrder_additional_cost)
order_additional_costRouter.post("/", order_additional_costController.addOrder_additional_cost)
order_additional_costRouter.put("/:orderadditionalcostid", order_additional_costController.updateOrder_additional_cost)
order_additional_costRouter.delete("/:orderadditionalcostid", order_additional_costController.deleteOrder_additional_cost)

module.exports = { order_additional_costRouter }