const { Router } = require("express")
const { bom_lineController } = require("../controller/bom_line-controller.js")

const bom_lineRouter = new Router()

bom_lineRouter.get("/", bom_lineController.getBom_lines)
bom_lineRouter.get("/:bomlineid", bom_lineController.getBom_line)
bom_lineRouter.post("/", bom_lineController.addBom_line)
bom_lineRouter.put("/:bomlineid", bom_lineController.updateBom_line)
bom_lineRouter.delete("/:bomlineid", bom_lineController.deleteBom_line)

module.exports = { bom_lineRouter }