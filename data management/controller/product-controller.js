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


exports.productController = {

    // ============================================================
    // GET ALL PRODUCTS
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getProducts(req, res) {

        const {
            search = "",
            status = "",
            spam = "",
            user_id
        } = req.query;

        try {

            const user = await getUser(user_id);

            if (!user) {

                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            const conditions = [];
            const values = [];

            if (search) {

                values.push(`%${search}%`);

                conditions.push(`
                (
                    p.name ILIKE $${values.length}
                    OR p.style_code ILIKE $${values.length}
                    OR p.sku ILIKE $${values.length}
                )
            `);
            }

            if (status) {

                values.push(status);

                conditions.push(
                    `p.status = $${values.length}`
                );
            }

            if (spam !== "") {

                values.push(spam === "true");

                conditions.push(
                    `p.spam = $${values.length}`
                );
            }

            const whereClause = conditions.length
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

            const result = await db.query(
                `
            SELECT *
            FROM products p
            ${whereClause}
            `,
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


    // ============================================================
    // GET ONE PRODUCT
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getProduct(req, res) {

        const {
            productid
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
                `
                SELECT *
                FROM products
                WHERE id = $1
                `,
                [productid]
            );


            const product = result.rows[0];


            if (!product) {

                return res.status(404).json({
                    error: "Product not found"
                });
            }


            res.json(product);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // ============================================================
    // ADD PRODUCT
    // editor / manager / admin / owner
    // ============================================================

    async addProduct(req, res) {

        const {
            name,
            style_code,
            sku,
            category,
            season,
            colors,
            sizes,
            pricing_multiplier,
            selling_price,
            currency,
            notes,
            status,
            image_url,
            attachment_id,
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
                    error: "You do not have permission to create products"
                });
            }


            const result = await db.query(
                `INSERT INTO products (
                    name,
                    style_code,
                    sku,
                    category,
                    season,
                    colors,
                    sizes,
                    pricing_multiplier,
                    selling_price,
                    currency,
                    notes,
                    status,
                    image_url,
                    attachment_id
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7,
                    $8, $9, $10, $11, $12, $13, $14
                )
                RETURNING *`,
                [
                    name,
                    style_code,
                    sku,
                    category,
                    season,
                    colors,
                    sizes,
                    pricing_multiplier,
                    selling_price,
                    currency,
                    notes,
                    status,
                    image_url || null,
                    attachment_id || null
                ]
            );


            res.status(201).json({
                success: true,
                product: result.rows[0]
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
    // UPDATE PRODUCT
    // editor / manager / admin / owner
    // ============================================================

    async updateProduct(req, res) {

        const {
            productid
        } = req.params;

        const {
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
                    error: "You do not have permission to update products"
                });
            }


            const fields = [
                "name",
                "style_code",
                "sku",
                "category",
                "season",
                "colors",
                "sizes",
                "pricing_multiplier",
                "selling_price",
                "currency",
                "notes",
                "status",
                "spam",
                "image_url",
                "attachment_id"
            ];


            const updates = [];
            const values = [];


            for (const field of fields) {

                if (req.body[field] !== undefined) {

                    values.push(req.body[field]);

                    updates.push(
                        `${field} = $${values.length}`
                    );
                }
            }


            if (updates.length === 0) {

                return res.status(400).json({
                    success: false,
                    message: "No fields to update"
                });
            }


            updates.push("updated_at = now()");

            values.push(productid);


            const result = await db.query(
                `UPDATE products
                 SET ${updates.join(", ")}
                 WHERE id = $${values.length}
                 RETURNING *`,
                values
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }


            return res.status(200).json({
                success: true,
                product: result.rows[0]
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },


    // ============================================================
    // DELETE PRODUCT
    // manager / admin / owner
    // ============================================================

    async deleteProduct(req, res) {

        const {
            productid
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
                    error: "You do not have permission to delete products"
                });
            }


            if (user.role === "editor") {

                return res.status(403).json({
                    success: false,
                    error: "Editors cannot delete products"
                });
            }


            const result = await db.query(
                `DELETE FROM products
                 WHERE id = $1
                 RETURNING *`,
                [productid]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }


            return res.status(200).json({
                success: true,
                deletedProduct: true,
                product: result.rows[0]
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