const db = require("../../db_connection");

async function getUser(userId) {

    if (!userId) {
        return null;
    }

    const result = await db.query(
        `SELECT id, role
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}


exports.materialController = {

    // ============================================================
    // GET ALL MATERIALS
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getMaterials(req, res) {

        const db = require("../../db_connection");

        const {
            name = "",
            category = "",
            status = "",
            spam = "",
            user_id
        } = req.query;

        try {

            if (!user_id) {
                return res.status(401).json({
                    error: "user_id is required"
                });
            }

            const user = await getUser(user_id);

            if (!user) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            const conditions = [];
            const values = [];

            if (name) {
                values.push(`%${name}%`);

                conditions.push(
                    `m.name ILIKE $${values.length}`
                );
            }

            if (category) {
                values.push(category);

                conditions.push(
                    `m.category = $${values.length}`
                );
            }

            if (status) {
                values.push(status);

                conditions.push(
                    `m.status = $${values.length}`
                );
            }

            if (spam !== "") {
                values.push(spam === "true");

                conditions.push(
                    `m.spam = $${values.length}`
                );
            }

            const whereClause =
                conditions.length
                    ? `WHERE ${conditions.join(" AND ")}`
                    : "";

            const result = await db.query(
                `SELECT *
             FROM materials m
             ${whereClause}
             ORDER BY m.name ASC`,
                values
            );

            return res.json(result.rows);

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                error: err.message
            });
        }
    },


    // ============================================================
    // GET ONE MATERIAL
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getMaterial(req, res) {

        const db = require("../../db_connection");

        const {
            materialid
        } = req.params;

        const {
            user_id
        } = req.query;


        try {

            const user = await getUser(user_id);

            if (!user) {

                return res.status(401).json({
                    error: "Unauthorized"
                });
            }


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


    // ============================================================
    // ADD MATERIAL
    // editor / manager / admin / owner
    // ============================================================

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
            status,
            user_id
        } = req.body;


        try {

            const user = await getUser(user_id);

            if (!user) {

                return res.status(401).json({
                    success: false,
                    error: "Unauthorized"
                });
            }


            if (
                user.role === "supplier" ||
                user.role === "viewer"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "You do not have permission to create materials"
                });
            }


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


    // ============================================================
    // UPDATE MATERIAL
    // editor / manager / admin / owner
    // ============================================================

    async updateMaterial(req, res) {

        const db = require("../../db_connection");

        const {
            materialid
        } = req.params;

        const {
            user_id
        } = req.body;

        try {

            const user = await getUser(user_id);

            if (!user) {

                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            if (
                user.role === "supplier" ||
                user.role === "viewer"
            ) {

                return res.status(403).json({
                    error: "You do not have permission to update materials"
                });
            }

            const allowedFields = [
                "name",
                "code",
                "description",
                "unit",
                "unit_cost",
                "currency",
                "supplier_id",
                "status",
                "spam"
            ];

            const fields = [];
            const values = [];

            for (const field of allowedFields) {

                if (req.body[field] !== undefined) {

                    values.push(req.body[field]);

                    fields.push(
                        `${field} = $${values.length}`
                    );
                }
            }

            if (fields.length === 0) {

                return res.status(400).json({
                    error: "No fields to update"
                });
            }

            values.push(materialid);

            const result = await db.query(
                `UPDATE materials
             SET ${fields.join(", ")}
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


    // ============================================================
    // DELETE MATERIAL
    // manager / admin / owner
    // ============================================================

    async deleteMaterial(req, res) {

        const db = require("../../db_connection");

        const {
            materialid
        } = req.params;

        const {
            user_id
        } = req.query;


        try {

            const user = await getUser(user_id);

            if (!user) {

                return res.status(401).json({
                    success: false,
                    error: "Unauthorized"
                });
            }


            if (
                user.role === "supplier" ||
                user.role === "viewer"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "You do not have permission to delete materials"
                });
            }


            if (user.role === "editor") {

                return res.status(403).json({
                    success: false,
                    error: "Editors cannot delete materials"
                });
            }


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
};