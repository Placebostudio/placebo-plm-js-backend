const db = require("./db_connection.js");

const skurouter = require("express").Router();


// ============================================================
// GET SKU STRUCTURE
// ============================================================

skurouter.get("/", async (req, res) => {

    const { user_id } = req.query;

    try {

        if (!user_id) {
            return res.status(401).json({
                error: "user_id is required"
            });
        }

        const userResult = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = $1
            `,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid user"
            });
        }


        const result = await db.query(`
            SELECT
                id,
                name,
                value_meaning,
                placement,
                format,
                allowed_values,
                required,
                created_at,
                created_by,
                spam
            FROM sku_structure
            WHERE spam = false
            ORDER BY placement ASC
        `);

        return res.status(200).json(result.rows);

    } catch (error) {

        console.error("Error getting SKU structure:", error);

        return res.status(500).json({
            error: error.message
        });
    }
});


module.exports = skurouter;