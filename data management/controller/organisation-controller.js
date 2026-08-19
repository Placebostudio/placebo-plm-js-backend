const { dbConnection } = require("../../db_connection")

exports.organisationController = {
    async getOrganisations(req, res) {
        const db = require("../../db_connection");

        try {
            const result = await db.query(
                `SELECT *
             FROM organisations
             ORDER BY created_at DESC`
            );

            res.json(result.rows);
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },
    async getOrganisation(req, res) {
        const db = require("../../db_connection");
        const { organisationid } = req.params;

        try {
            const result = await db.query(
                `SELECT *
             FROM organisations
             WHERE id = $1`,
                [organisationid]
            );

            const organisation = result.rows[0];

            if (!organisation) {
                return res.status(404).json({
                    error: "Organisation not found"
                });
            }

            res.json(organisation);
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },
    async addOrganisation(req, res) {
        const db = require("../../db_connection");

        const {
            id,
            name,
            base_currency
        } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO organisations (
                id,
                name,
                base_currency
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
                [
                    id,
                    name,
                    base_currency
                ]
            );

            res.status(201).json({
                success: true,
                organisation: result.rows[0]
            });
        } catch (err) {
            console.error(err);

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },
    async updateOrganisation(req, res) {
        const db = require("../../db_connection");
        const { organisationid } = req.params;

        const {
            name,
            base_currency
        } = req.body;

        try {
            const result = await db.query(
                `UPDATE organisations
             SET
                name = $1,
                base_currency = $2
             WHERE id = $3
             RETURNING *`,
                [
                    name,
                    base_currency,
                    organisationid
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Organisation not found"
                });
            }

            return res.status(200).json({
                success: true,
                organisation: result.rows[0]
            });
        } catch (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },
    async deleteOrganisation(req, res) {
        const db = require("../../db_connection");
        const { organisationid } = req.params;

        try {
            const result = await db.query(
                `DELETE FROM organisations
             WHERE id = $1
             RETURNING *`,
                [organisationid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Organisation not found"
                });
            }

            return res.status(200).json({
                success: true,
                deletedOrganisation: true,
                organisation: result.rows[0]
            });
        } catch (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
}