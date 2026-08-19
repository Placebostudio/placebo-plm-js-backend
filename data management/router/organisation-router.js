const { Router } = require("express")
const { organisationController } = require("../controller/organisation-controller.js")

const organisationRouter = new Router()

organisationRouter.get("/", organisationController.getOrganisations)
organisationRouter.get("/:organisationid", organisationController.getOrganisation)
organisationRouter.post("/", organisationController.addOrganisation)
organisationRouter.put("/:organisationid", organisationController.updateOrganisation)
organisationRouter.delete("/:organisationid", organisationController.deleteOrganisation)

module.exports = { organisationRouter }