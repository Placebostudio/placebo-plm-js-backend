const { Router } = require("express")
const { materialController } = require("../controller/material-controller.js")

const materialRouter = new Router()

materialRouter.get("/", materialController.getMaterials)
materialRouter.get("/:materialid", materialController.getMaterial)
materialRouter.post("/", materialController.addMaterial)
materialRouter.put("/:materialid", materialController.updateMaterial)
materialRouter.delete("/:materialid", materialController.deleteMaterial)

module.exports = { materialRouter }