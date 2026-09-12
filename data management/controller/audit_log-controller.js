const { dbConnection } = require("../../db_connection")

exports.audit_logController = {

    // ============================================================
    // GET ALL AUDIT LOGS
    // ============================================================

    async getAudit_logs(req, res) {

        const db = require("../../db_connection");

        const {
            search = "",
            user = "",
            action = "",
            entity_type = "",
            dateFrom = "",
            dateTo = "",
            user_id
        } = req.query;


        try {

            // ====================================================
            // CHECK USER
            // ====================================================

            const userResult = await db.query(
                `SELECT id, role
                 FROM users
                 WHERE id = $1`,
                [user_id]
            );

            if (userResult.rows.length === 0) {

                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            const currentUser = userResult.rows[0];


            // ====================================================
            // VIEW PERMISSION
            // ====================================================

            if (
                currentUser.role === "supplier" ||
                currentUser.role === "viewer"
            ) {

                return res.status(403).json({
                    error: "You do not have permission to view audit logs"
                });
            }


            // ====================================================
            // FILTERS
            // ====================================================

            const conditions = [];
            const values = [];


            // Search

            if (search) {

                values.push(`%${search.toLowerCase()}%`);

                const param = `$${values.length}`;

                conditions.push(`
                    (
                        LOWER(a.id::text) LIKE ${param}
                        OR LOWER(a.entity_type) LIKE ${param}
                        OR LOWER(a.action) LIKE ${param}
                        OR LOWER(COALESCE(u.username, '')) LIKE ${param}
                    )
                `);
            }


            // User

            if (user) {

                values.push(user);

                conditions.push(
                    `LOWER(a.user_id::text) = LOWER($${values.length})`
                );
            }


            // Entity type

            if (entity_type) {

                values.push(entity_type.toLowerCase());

                conditions.push(
                    `LOWER(a.entity_type) = $${values.length}`
                );
            }


            // Action

            if (action) {

                const actionValue = action.toLowerCase();


                if (actionValue === "restore") {

                    conditions.push(`
                        LOWER(a.action) = 'restore'
                    `);

                } else if (actionValue === "hard_delete") {

                    conditions.push(`
                        LOWER(a.action) = 'hard_delete'
                    `);

                } else if (
                    actionValue.endsWith("role changed")
                ) {

                    conditions.push(`
                        LOWER(a.entity_type) = 'user'
                        AND LOWER(a.action) = 'update'
                    `);

                } else {

                    const parts = actionValue.split(" ");

                    const actionWord = parts.pop();

                    const entityName = parts.join(" ");


                    if (actionWord === "created") {

                        values.push(entityName);

                        conditions.push(`
                            LOWER(a.entity_type) = $${values.length}
                            AND LOWER(a.action) = 'create'
                        `);

                    } else if (actionWord === "deleted") {

                        values.push(entityName);

                        conditions.push(`
                            LOWER(a.entity_type) = $${values.length}
                            AND LOWER(a.action) = 'delete'
                        `);

                    } else if (actionWord === "updated") {

                        values.push(entityName);

                        conditions.push(`
                            LOWER(a.entity_type) = $${values.length}
                            AND LOWER(a.action) = 'update'
                        `);

                    } else if (actionWord === "edited") {

                        values.push(entityName);

                        conditions.push(`
                            LOWER(a.entity_type) = $${values.length}
                            AND LOWER(a.action) = 'update'
                            AND LOWER(a.entity_type) <> 'order'
                            AND LOWER(a.entity_type) <> 'user'
                        `);

                    } else {

                        conditions.push(`FALSE`);
                    }
                }
            }


            // Date from

            if (dateFrom) {

                values.push(dateFrom);

                conditions.push(
                    `a.created_at >= $${values.length}::timestamptz`
                );
            }


            // Date to

            if (dateTo) {

                values.push(dateTo);

                conditions.push(
                    `a.created_at <= $${values.length}::timestamptz`
                );
            }


            const whereClause = conditions.length
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


            // ====================================================
            // GET LOGS
            // ====================================================

            const result = await db.query(
                `
                SELECT
                    a.*,
                    u.username AS username,
                    u.role AS role
                FROM audit_logs a
                LEFT JOIN users u
                    ON a.user_id = u.id
                ${whereClause}
                ORDER BY a.created_at DESC
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
    // GET ONE AUDIT LOG
    // ============================================================

    async getAudit_log(req, res) {

        const db = require("../../db_connection");

        const {
            auditlogid
        } = req.params;

        const {
            user_id
        } = req.query;


        try {

            // ====================================================
            // CHECK USER
            // ====================================================

            const userResult = await db.query(
                `SELECT id, role
                 FROM users
                 WHERE id = $1`,
                [user_id]
            );

            if (userResult.rows.length === 0) {

                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            const currentUser = userResult.rows[0];


            // ====================================================
            // VIEW PERMISSION
            // ====================================================

            if (
                currentUser.role === "supplier" ||
                currentUser.role === "viewer"
            ) {

                return res.status(403).json({
                    error: "You do not have permission to view audit logs"
                });
            }


            // ====================================================
            // GET AUDIT LOG
            // ====================================================

            const result = await db.query(
                `SELECT *
                 FROM audit_logs
                 WHERE id = $1`,
                [auditlogid]
            );


            const auditLog = result.rows[0];


            if (!auditLog) {

                return res.status(404).json({
                    error: "Audit log not found"
                });
            }


            res.json(auditLog);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // ============================================================
    // ADD AUDIT LOG
    // ============================================================

    async addAudit_log(req, res) {

        const db = require("../../db_connection");

        const {
            user_id,
            action,
            entity_type,
            entity_id,
            before,
            after,
            ip_address
        } = req.body;


        try {

            // ====================================================
            // CHECK USER
            // ====================================================

            const userResult = await db.query(
                `SELECT id, role
                 FROM users
                 WHERE id = $1`,
                [user_id]
            );

            if (userResult.rows.length === 0) {

                return res.status(401).json({
                    success: false,
                    error: "Unauthorized"
                });
            }

            const currentUser = userResult.rows[0];


            // ====================================================
            // SUPPLIER / VIEWER CANNOT ADD
            // ====================================================

            if (
                currentUser.role === "supplier" ||
                currentUser.role === "viewer"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "You do not have permission to create audit logs"
                });
            }


            // ====================================================
            // LOGIN / LOGOUT ARE NOT AUDIT LOGS
            // ====================================================

            if (
                action &&
                (
                    action.toLowerCase() === "login" ||
                    action.toLowerCase() === "logout"
                )
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Login and logout actions cannot be added to audit logs"
                });
            }


            // ====================================================
            // CREATE AUDIT LOG
            // ====================================================

            const result = await db.query(
                `INSERT INTO audit_logs (
                    user_id,
                    action,
                    entity_type,
                    entity_id,
                    before,
                    after,
                    ip_address
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    user_id,
                    action,
                    entity_type,
                    entity_id,
                    before,
                    after,
                    ip_address
                ]
            );


            res.status(201).json({
                success: true,
                auditLog: result.rows[0]
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
    // UPDATE AUDIT LOG
    // ============================================================

    async updateAudit_log(req, res) {

        const db = require("../../db_connection");

        const {
            auditlogid
        } = req.params;

        const {
            user_id,
            action,
            entity_type,
            entity_id,
            before,
            after,
            ip_address
        } = req.body;


        try {

            // ====================================================
            // CHECK USER
            // ====================================================

            const userResult = await db.query(
                `SELECT id, role
                 FROM users
                 WHERE id = $1`,
                [user_id]
            );

            if (userResult.rows.length === 0) {

                return res.status(401).json({
                    success: false,
                    error: "Unauthorized"
                });
            }

            const currentUser = userResult.rows[0];


            // ====================================================
            // SUPPLIER / VIEWER
            // ====================================================

            if (
                currentUser.role === "supplier" ||
                currentUser.role === "viewer"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "You do not have permission to edit audit logs"
                });
            }


            // ====================================================
            // EDITOR CANNOT EDIT
            // ====================================================

            if (currentUser.role === "editor") {

                return res.status(403).json({
                    success: false,
                    error: "Editors can only create audit logs"
                });
            }


            // ====================================================
            // UPDATE AUDIT LOG
            // ====================================================

            const result = await db.query(
                `UPDATE audit_logs
                 SET
                    user_id = $1,
                    action = $2,
                    entity_type = $3,
                    entity_id = $4,
                    before = $5,
                    after = $6,
                    ip_address = $7
                 WHERE id = $8
                 RETURNING *`,
                [
                    user_id,
                    action,
                    entity_type,
                    entity_id,
                    before,
                    after,
                    ip_address,
                    auditlogid
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Audit log not found"
                });
            }


            return res.status(200).json({
                success: true,
                auditLog: result.rows[0]
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
    // DELETE AUDIT LOG
    // ============================================================

    async deleteAudit_log(req, res) {

        const db = require("../../db_connection");

        const {
            auditlogid
        } = req.params;

        const {
            user_id
        } = req.query;


        try {

            // ====================================================
            // CHECK USER
            // ====================================================

            const userResult = await db.query(
                `SELECT id, role
                 FROM users
                 WHERE id = $1`,
                [user_id]
            );

            if (userResult.rows.length === 0) {

                return res.status(401).json({
                    success: false,
                    error: "Unauthorized"
                });
            }

            const currentUser = userResult.rows[0];


            // ====================================================
            // SUPPLIER / VIEWER
            // ====================================================

            if (
                currentUser.role === "supplier" ||
                currentUser.role === "viewer"
            ) {

                return res.status(403).json({
                    success: false,
                    error: "You do not have permission to delete audit logs"
                });
            }


            // ====================================================
            // EDITOR CANNOT DELETE
            // ====================================================

            if (currentUser.role === "editor") {

                return res.status(403).json({
                    success: false,
                    error: "Editors can only create audit logs"
                });
            }


            // ====================================================
            // DELETE AUDIT LOG
            // ====================================================

            const result = await db.query(
                `DELETE FROM audit_logs
                 WHERE id = $1
                 RETURNING *`,
                [auditlogid]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Audit log not found"
                });
            }


            return res.status(200).json({
                success: true,
                deletedAuditLog: true,
                auditLog: result.rows[0]
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
};