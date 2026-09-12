const db = require("../../db_connection");;


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


exports.order_lineController = {

    // ============================================================
    // GET ALL ORDER LINES
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getOrder_lines(req, res) {

        const db = require("../../db_connection");

        const {
            order_id = "",
            product_id = "",
            color = "",
            size = "",
            destination = "",
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


            if (order_id) {

                values.push(order_id);

                conditions.push(
                    `ol.order_id = $${values.length}`
                );
            }


            if (product_id) {

                values.push(product_id);

                conditions.push(
                    `ol.product_id = $${values.length}`
                );
            }


            if (color) {

                values.push(`%${color}%`);

                conditions.push(
                    `ol.color ILIKE $${values.length}`
                );
            }


            if (size) {

                values.push(`%${size}%`);

                conditions.push(
                    `ol.size ILIKE $${values.length}`
                );
            }


            if (destination) {

                values.push(`%${destination}%`);

                conditions.push(
                    `ol.destination ILIKE $${values.length}`
                );
            }


            const whereClause = conditions.length
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


            const result = await db.query(
                `SELECT *
                 FROM order_lines ol
                 ${whereClause}
                 ORDER BY ol.order_id, ol.id`,
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
    // GET ONE ORDER LINE
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getOrder_line(req, res) {

        const db = require("../../db_connection");

        const {
            orderlineid
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
                 FROM order_lines
                 WHERE id = $1`,
                [orderlineid]
            );


            const orderLine = result.rows[0];


            if (!orderLine) {

                return res.status(404).json({
                    error: "Order line not found"
                });
            }


            res.json(orderLine);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // ============================================================
    // ADD ORDER LINE
    // editor / manager / admin / owner
    // ============================================================

    async addOrder_line(req, res) {

        const db = require("../../db_connection");

        const {
            id,
            order_id,
            product_id,
            color,
            size,
            quantity,
            destination,
            user_id
        } = req.body;


        const lineId =
            id || require("crypto").randomUUID();


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
                    error: "You do not have permission to create order lines"
                });
            }


            const result = await db.query(
                `INSERT INTO order_lines (
                    id,
                    order_id,
                    product_id,
                    color,
                    size,
                    quantity,
                    destination
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    lineId,
                    order_id,
                    product_id,
                    color,
                    size,
                    quantity,
                    destination
                ]
            );


            res.status(201).json({
                success: true,
                orderLine: result.rows[0]
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
    // UPDATE ORDER LINE
    // editor / manager / admin / owner
    // ============================================================

    async updateOrder_line(req, res) {

        const db = require("../../db_connection");

        const {
            orderlineid
        } = req.params;

        const {
            order_id,
            product_id,
            color,
            size,
            quantity,
            destination,
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
                    error: "You do not have permission to update order lines"
                });
            }


            const result = await db.query(
                `UPDATE order_lines
                 SET
                    order_id = $1,
                    product_id = $2,
                    color = $3,
                    size = $4,
                    quantity = $5,
                    destination = $6
                 WHERE id = $7
                 RETURNING *`,
                [
                    order_id,
                    product_id,
                    color,
                    size,
                    quantity,
                    destination,
                    orderlineid
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Order line not found"
                });
            }


            return res.status(200).json({
                success: true,
                orderLine: result.rows[0]
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
    // DELETE ORDER LINE
    // manager / admin / owner
    // ============================================================

    async deleteOrder_line(req, res) {

        const db = require("../../db_connection");

        const {
            orderlineid
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
                    error: "You do not have permission to delete order lines"
                });
            }


            if (user.role === "editor") {

                return res.status(403).json({
                    success: false,
                    error: "Editors cannot delete order lines"
                });
            }


            const result = await db.query(
                `DELETE FROM order_lines
                 WHERE id = $1
                 RETURNING *`,
                [orderlineid]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Order line not found"
                });
            }


            return res.status(200).json({
                success: true,
                deletedOrderLine: true,
                orderLine: result.rows[0]
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