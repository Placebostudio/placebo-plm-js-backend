const { dbConnection } = require("../../db_connection");


async function getUser(userId) {

    if (!userId) {
        return null;
    }

    const result = await dbConnection.query(
        `SELECT id, role
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}


exports.order_additional_costController = {

    // ============================================================
    // GET ALL ORDER ADDITIONAL COSTS
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getOrder_additional_costs(req, res) {

        const db = require("../../db_connection");

        const {
            order = "",
            cost_type = "",
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


            if (order) {

                values.push(`%${order}%`);

                conditions.push(
                    `o.order_number ILIKE $${values.length}`
                );
            }


            if (cost_type) {

                values.push(cost_type);

                conditions.push(
                    `oac.cost_type = $${values.length}`
                );
            }


            const whereClause = conditions.length
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


            const result = await db.query(
                `SELECT
                    oac.*,
                    o.order_number
                 FROM order_additional_costs oac
                 JOIN orders o
                    ON oac.order_id = o.id
                 ${whereClause}
                 ORDER BY oac.id`,
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
    // GET ONE ORDER ADDITIONAL COST
    // supplier / viewer / editor / manager / admin / owner
    // ============================================================

    async getOrder_additional_cost(req, res) {

        const db = require("../../db_connection");

        const {
            orderadditionalcostid
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
                 FROM order_additional_costs
                 WHERE id = $1`,
                [orderadditionalcostid]
            );


            const cost = result.rows[0];


            if (!cost) {

                return res.status(404).json({
                    error: "Order additional cost not found"
                });
            }


            res.json(cost);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // ============================================================
    // ADD ORDER ADDITIONAL COST
    // editor / manager / admin / owner
    // ============================================================

    async addOrder_additional_cost(req, res) {

        const db = require("../../db_connection");

        const {
            id,
            order_id,
            amount,
            cost_type,
            currency,
            description,
            user_id
        } = req.body;


        const costId =
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
                    error: "You do not have permission to create order additional costs"
                });
            }


            const result = await db.query(
                `INSERT INTO order_additional_costs (
                    id,
                    order_id,
                    amount,
                    cost_type,
                    currency,
                    description
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    costId,
                    order_id,
                    amount,
                    cost_type,
                    currency,
                    description
                ]
            );


            res.status(201).json({
                success: true,
                orderAdditionalCost: result.rows[0]
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
    // UPDATE ORDER ADDITIONAL COST
    // editor / manager / admin / owner
    // ============================================================

    async updateOrder_additional_cost(req, res) {

        const db = require("../../db_connection");

        const {
            orderadditionalcostid
        } = req.params;

        const {
            order_id,
            amount,
            cost_type,
            currency,
            description,
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
                    error: "You do not have permission to update order additional costs"
                });
            }


            const result = await db.query(
                `UPDATE order_additional_costs
                 SET
                    order_id = $1,
                    amount = $2,
                    cost_type = $3,
                    currency = $4,
                    description = $5
                 WHERE id = $6
                 RETURNING *`,
                [
                    order_id,
                    amount,
                    cost_type,
                    currency,
                    description,
                    orderadditionalcostid
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Order additional cost not found"
                });
            }


            return res.status(200).json({
                success: true,
                orderAdditionalCost: result.rows[0]
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
    // DELETE ORDER ADDITIONAL COST
    // manager / admin / owner
    // ============================================================

    async deleteOrder_additional_cost(req, res) {

        const db = require("../../db_connection");

        const {
            orderadditionalcostid
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
                    error: "You do not have permission to delete order additional costs"
                });
            }


            if (user.role === "editor") {

                return res.status(403).json({
                    success: false,
                    error: "Editors cannot delete order additional costs"
                });
            }


            const result = await db.query(
                `DELETE FROM order_additional_costs
                 WHERE id = $1
                 RETURNING *`,
                [orderadditionalcostid]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Order additional cost not found"
                });
            }


            return res.status(200).json({
                success: true,
                deletedOrderAdditionalCost: true,
                orderAdditionalCost: result.rows[0]
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