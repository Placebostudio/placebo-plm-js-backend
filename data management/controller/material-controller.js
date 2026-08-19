const { dbConnection } = require("../../db_connection")

exports.materialController = {
    async getMaterials(req, res) {
        const db = require("../../db_connection");

        const {
            name = "",
            category = "",
            status = ""
        } = req.query;

        const conditions = [];
        const values = [];

        if (name) {
            values.push(`%${name}%`);
            conditions.push(`m.name ILIKE $${values.length}`);
        }

        if (category) {
            values.push(category);
            conditions.push(`m.category = $${values.length}`);
        }

        if (status) {
            values.push(status);
            conditions.push(`m.status = $${values.length}`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        try {
            const result = await db.query(
                `SELECT *
             FROM materials m
             ${whereClause}
             ORDER BY m.name ASC`,
                values
            );

            res.json(result.rows);
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },
    async getMaterial(req, res) {
        const db = require("../../db_connection");
        const { materialid } = req.params;

        try {
            const result = await db.query(
                `SELECT *
             FROM materials
             WHERE id = $1`,
                [materialid]
            );

            const material = result.rows[0];

            if (!material) {
                return res.status(404).json({
                    error: "Material not found"
                });
            }

            res.json(material);
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },
    async addMaterial(req, res) {
        const db = require("../../db_connection");

        const {
            name,
            color,
            color_hex,
            category,
            supplier_id,
            unit_cost,
            currency,
            unit_of_measure,
            minimum_order_quantity,
            notes,
            status
        } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO materials (
                name,
                color,
                color_hex,
                category,
                supplier_id,
                unit_cost,
                currency,
                unit_of_measure,
                minimum_order_quantity,
                notes,
                status
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11
            )
            RETURNING *`,
                [
                    name,
                    color,
                    color_hex,
                    category,
                    supplier_id,
                    unit_cost,
                    currency,
                    unit_of_measure,
                    minimum_order_quantity,
                    notes,
                    status
                ]
            );

            res.status(201).json({
                success: true,
                material: result.rows[0]
            });

        } catch (err) {
            console.error(err);

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },
    async updateMaterial(req, res) {
        const db = require("../../db_connection");
        const { materialid } = req.params;

        const allowedFields = [
            'name',
            'code',
            'description',
            'unit',
            'cost',
            'currency',
            'supplier_id',
            'status',
            'spam'
        ];

        const fields = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                values.push(req.body[field]);
                fields.push(`${field} = $${values.length}`);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({
                error: "No fields to update"
            });
        }

        values.push(materialid);

        try {
            const result = await db.query(
                `UPDATE materials
             SET ${fields.join(', ')}
             WHERE id = $${values.length}
             RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Material not found"
                });
            }

            res.json(result.rows[0]);

        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },
    async deleteMaterial(req, res) {
        const db = require("../../db_connection");

        const { materialid } = req.params;

        try {
            const result = await db.query(
                `DELETE FROM materials
             WHERE id = $1
             RETURNING *`,
                [materialid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Material not found"
                });
            }

            return res.status(200).json({
                success: true,
                deletedMaterial: true,
                material: result.rows[0]
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