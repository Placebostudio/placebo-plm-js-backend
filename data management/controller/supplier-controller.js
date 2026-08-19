const { dbConnection } = require("../../db_connection")

exports.supplierController = {
    async getSuppliers(req, res) {
        const db = require("../../db_connection");

        const {
            search = "",
            status = ""
        } = req.query;

        const conditions = [];
        const values = [];

        if (search) {
            values.push(`%${search}%`);

            conditions.push(`(
            s.name ILIKE $${values.length}
            OR s.country ILIKE $${values.length}
        )`);
        }

        if (status) {
            values.push(status);
            conditions.push(`s.status = $${values.length}`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        try {
            const result = await db.query(
                `SELECT *
             FROM suppliers s
             ${whereClause}
             ORDER BY s.name ASC`,
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
    async getSupplier(req, res) {
        const db = require("../../db_connection");
        const { supplierid } = req.params;

        try {
            const result = await db.query(
                `SELECT *
             FROM suppliers
             WHERE id = $1`,
                [supplierid]
            );

            const supplier = result.rows[0];

            if (!supplier) {
                return res.status(404).json({
                    error: "Supplier not found"
                });
            }

            res.json(supplier);
        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },
    async addSupplier(req, res) {
        const db = require("../../db_connection");

        const {
            id,
            name,
            country,
            contact_name,
            contact_email,
            contact_phone,
            website,
            lead_time_days,
            payment_terms,
            notes,
            status,
            spam
        } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO suppliers (
                id,
                name,
                country,
                contact_name,
                contact_email,
                contact_phone,
                website,
                lead_time_days,
                payment_terms,
                notes,
                status,
                spam
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12
            )
            RETURNING *`,
                [
                    id,
                    name,
                    country,
                    contact_name,
                    contact_email,
                    contact_phone,
                    website,
                    lead_time_days,
                    payment_terms,
                    notes,
                    status,
                    spam
                ]
            );

            res.status(201).json({
                success: true,
                supplier: result.rows[0]
            });
        } catch (err) {
            console.error(err);

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },
    async updateSupplier(req, res) {
        const db = require("../../db_connection");
        const { supplierid } = req.params;

        const {
            name,
            country,
            contact_name,
            contact_email,
            contact_phone,
            website,
            lead_time_days,
            payment_terms,
            notes,
            status,
            spam
        } = req.body;

        try {
            const result = await db.query(
                `UPDATE suppliers
             SET
                name = COALESCE($1, name),
                country = COALESCE($2, country),
                contact_name = COALESCE($3, contact_name),
                contact_email = COALESCE($4, contact_email),
                contact_phone = COALESCE($5, contact_phone),
                website = COALESCE($6, website),
                lead_time_days = COALESCE($7, lead_time_days),
                payment_terms = COALESCE($8, payment_terms),
                notes = COALESCE($9, notes),
                status = COALESCE($10, status),
                spam = COALESCE($11, spam),
                updated_at = now()
             WHERE id = $12
             RETURNING *`,
                [
                    name,
                    country,
                    contact_name,
                    contact_email,
                    contact_phone,
                    website,
                    lead_time_days,
                    payment_terms,
                    notes,
                    status,
                    spam,
                    supplierid
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Supplier not found"
                });
            }

            return res.status(200).json({
                success: true,
                supplier: result.rows[0]
            });

        } catch (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },
    async deleteSupplier(req, res) {
        const db = require("../../db_connection");

        const { supplierid } = req.params;

        try {
            const result = await db.query(
                `DELETE FROM suppliers
             WHERE id = $1
             RETURNING *`,
                [supplierid]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Supplier not found"
                });
            }

            return res.status(200).json({
                success: true,
                deletedSupplier: true,
                supplier: result.rows[0]
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