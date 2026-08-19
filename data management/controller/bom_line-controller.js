const { dbConnection } = require("../../db_connection")

exports.bom_lineController = {
    async getBom_lines(req, res) {
        const db = require("../../db_connection");

        const {
            product_id = "",
            material = "",
            supplier = "",
            material_id = ""
        } = req.query;

        const conditions = [];
        const values = [];

        // Product filter
        if (product_id) {
            values.push(product_id);
            conditions.push(`b.product_id = $${values.length}`);
        }

        // Material name
        if (material) {
            values.push(`%${material}%`);
            conditions.push(`m.name ILIKE $${values.length}`);
        }

        // Supplier name
        if (supplier) {
            values.push(`%${supplier}%`);
            conditions.push(`s.name ILIKE $${values.length}`);
        }

        // Exact material ID
        if (material_id) {
            values.push(material_id);
            conditions.push(`b.material_id = $${values.length}`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        try {
            const result = await db.query(
                `SELECT
                b.*,
                p.name AS product_name,
                m.name AS material_name,
                s.name AS supplier_name
             FROM bom_lines b
             JOIN products p
                ON b.product_id = p.id
             JOIN materials m
                ON b.material_id = m.id
             LEFT JOIN suppliers s
                ON m.supplier_id = s.id
             ${whereClause}
             ORDER BY b.sort_order ASC, b.id`,
                values
            );

            res.json(result.rows);

        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    }, async getBom_line(req, res) {
        const db = require("../../db_connection");
        const { bomlineid } = req.params;

        try {
            const result = await db.query(
                `SELECT
                b.*,
                p.name AS product_name,
                m.name AS material_name,
                s.name AS supplier_name
             FROM bom_lines b
             JOIN products p
                ON b.product_id = p.id
             JOIN materials m
                ON b.material_id = m.id
             LEFT JOIN suppliers s
                ON m.supplier_id = s.id
             WHERE b.id = $1`,
                [bomlineid]
            );

            const bomLine = result.rows[0];

            if (!bomLine) {
                return res.status(404).json({
                    error: "BOM line not found"
                });
            }

            res.json(bomLine);
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    }, async addBom_line(req, res) {
        const db = require("../../db_connection");

        const {
            product_id,
            material_id,
            quantity_per_unit,
            unit_of_measure,
            notes,
            sort_order
        } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO bom_lines (
                product_id,
                material_id,
                quantity_per_unit,
                unit_of_measure,
                notes,
                sort_order
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
                [
                    product_id,
                    material_id,
                    quantity_per_unit,
                    unit_of_measure,
                    notes,
                    sort_order
                ]
            );

            return res.status(201).json({
                success: true,
                bomLine: result.rows[0]
            });

        } catch (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }, async updateBom_line(req, res) {
        const db = require("../../db_connection");
        const { bomlineid } = req.params;

        const {
            material_id,
            quantity_per_unit,
            unit_of_measure,
            notes,
            sort_order
        } = req.body;

        try {
            const result = await db.query(
                `UPDATE bom_lines
             SET
                material_id = $1,
                quantity_per_unit = $2,
                unit_of_measure = $3,
                notes = $4,
                sort_order = $5,
                updated_at = now()
             WHERE id = $6
             RETURNING *`,
                [
                    material_id,
                    quantity_per_unit,
                    unit_of_measure,
                    notes,
                    sort_order,
                    bomlineid
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "BOM line not found"
                });
            }

            return res.status(200).json({
                success: true,
                bomLine: result.rows[0]
            });

        } catch (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }, async deleteBom_line(req, res) {
        const db = require("../../db_connection");
        const { bomlineid } = req.params;

        try {
            const result = await db.query(
                `DELETE FROM bom_lines
             WHERE id = $1
             RETURNING *`,
                [bomlineid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "BOM line not found"
                });
            }

            return res.status(200).json({
                success: true,
                deletedBomLine: true,
                bomLine: result.rows[0]
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