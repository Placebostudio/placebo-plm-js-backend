const { dbConnection } = require("../../db_connection");

exports.order_lineController = {

    async getOrder_lines(req, res) {
        const db = require("../../db_connection");

        const {
            order_id = "",
            product_id = "",
            color = "",
            size = "",
            destination = ""
        } = req.query;

        const conditions = [];
        const values = [];

        if (order_id) {
            values.push(order_id);
            conditions.push(`ol.order_id = $${values.length}`);
        }

        if (product_id) {
            values.push(product_id);
            conditions.push(`ol.product_id = $${values.length}`);
        }

        if (color) {
            values.push(`%${color}%`);
            conditions.push(`ol.color ILIKE $${values.length}`);
        }

        if (size) {
            values.push(`%${size}%`);
            conditions.push(`ol.size ILIKE $${values.length}`);
        }

        if (destination) {
            values.push(`%${destination}%`);
            conditions.push(`ol.destination ILIKE $${values.length}`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        try {
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
    async getOrder_line(req, res) {
        const db = require("../../db_connection");
        const { orderlineid } = req.params;

        try {
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
    async addOrder_line(req, res) {
        const db = require("../../db_connection");

        const {
            id,
            order_id,
            product_id,
            color,
            size,
            quantity,
            destination
        } = req.body;

        const lineId = id || require('crypto').randomUUID();

        try {
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
    async updateOrder_line(req, res) {
        const db = require("../../db_connection");
        const { orderlineid } = req.params;

        const {
            order_id,
            product_id,
            color,
            size,
            quantity,
            destination
        } = req.body;

        try {
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
    async deleteOrder_line(req, res) {
        const db = require("../../db_connection");
        const { orderlineid } = req.params;

        try {
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