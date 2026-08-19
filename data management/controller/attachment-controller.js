const db = require("../../db_connection");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

const BUCKET_NAME = "attachments";

const attachmentController = {

    // =========================
    // GET ALL ATTACHMENTS
    // =========================


    async getAttachments(req, res) 
    {

        try {
            const result = await db.query(
                `SELECT *
                 FROM attachments
                 ORDER BY created_at DESC`
            );

            const attachments = result.rows.map((attachment) => {

                const { data } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(attachment.url);

                return {
                    ...attachment,
                    url: data.publicUrl
                };
            });

            res.json(attachments);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // =========================
    // GET ONE ATTACHMENT
    // =========================

    async getAttachment(req, res) 
    {
        try {

            const result = await db.query(
                `SELECT *
                 FROM attachments
                 WHERE id = $1`,
                [req.params.attachmentid]
            );

            if (result.rows.length === 0) {

                return res.status(404).json({
                    error: "Attachment not found"
                });
            }

            const attachment = result.rows[0];

            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(attachment.url);

            res.json({
                ...attachment,
                url: data.publicUrl
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // =========================
    // ADD / REPLACE / REMOVE
    // =========================

    async addAttachment(req, res) {

        try {

            const {
                entity_type,
                entity_id,
                uploaded_by
            } = req.body;


            // =========================
            // VALIDATE ENTITY
            // =========================

            if (
                !["product", "material"].includes(entity_type)
            ) {

                return res.status(400).json({
                    error: "Invalid entity type"
                });
            }


            // =========================
            // CHECK EXISTING IMAGE
            // =========================

            const existing = await db.query(
                `SELECT *
                 FROM attachments
                 WHERE entity_type = $1
                 AND entity_id = $2
                 LIMIT 1`,
                [
                    entity_type,
                    entity_id
                ]
            );

            const oldAttachment =
                existing.rows[0] || null;


            // =========================
            // NO NEW IMAGE
            // =========================
            // YES IMAGE + NO IMAGE
            // -> REMOVE IMAGE

            if (!req.file) {

                if (!oldAttachment) {

                    return res.status(200).json({
                        success: true,
                        message: "No image to remove"
                    });
                }


                const { error: storageError } =
                    await supabase.storage
                        .from(BUCKET_NAME)
                        .remove([
                            oldAttachment.url
                        ]);


                if (storageError) {
                    throw storageError;
                }


                await db.query(
                    `DELETE FROM attachments
                     WHERE id = $1`,
                    [oldAttachment.id]
                );


                return res.status(200).json({
                    success: true,
                    message: "Image removed"
                });
            }


            // =========================
            // VALIDATE FILE TYPE
            // =========================

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
                "application/pdf"
            ];

            if (
                !allowedTypes.includes(
                    req.file.mimetype
                )
            ) {

                return res.status(400).json({
                    error: "Unsupported file type"
                });
            }


            // =========================
            // VALIDATE FILE SIZE
            // =========================

            if (req.file.size > 26214400) {

                return res.status(400).json({
                    error: "File cannot exceed 25 MB"
                });
            }


            // =========================
            // REMOVE OLD IMAGE
            // =========================
            // YES IMAGE + NEW IMAGE
            // -> REMOVE OLD IMAGE

            if (oldAttachment) {

                const { error: storageError } =
                    await supabase.storage
                        .from(BUCKET_NAME)
                        .remove([
                            oldAttachment.url
                        ]);


                if (storageError) {
                    throw storageError;
                }
            }


            // =========================
            // CREATE STORAGE PATH
            // =========================

            const fileName =
                `${Date.now()}-${req.file.originalname}`;

            const storagePath =
                `${entity_type}/${entity_id}/${fileName}`;


            // =========================
            // UPLOAD NEW IMAGE
            // =========================

            const { error: uploadError } =
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(
                        storagePath,
                        req.file.buffer,
                        {
                            contentType:
                                req.file.mimetype,

                            upsert: false
                        }
                    );


            if (uploadError) {
                throw uploadError;
            }


            // =========================
            // UPDATE EXISTING ROW
            // =========================

            let result;

            if (oldAttachment) {

                result = await db.query(
                    `UPDATE attachments
                     SET
                        file_name = $1,
                        url = $2,
                        content_type = $3,
                        size_bytes = $4,
                        uploaded_by = $5
                     WHERE id = $6
                     RETURNING *`,
                    [
                        req.file.originalname,
                        storagePath,
                        req.file.mimetype,
                        req.file.size,
                        uploaded_by || null,
                        oldAttachment.id
                    ]
                );

            }

            // =========================
            // CREATE NEW ROW
            // =========================

            else {

                result = await db.query(
                    `INSERT INTO attachments (
                        entity_type,
                        entity_id,
                        file_name,
                        url,
                        content_type,
                        size_bytes,
                        uploaded_by
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
                    )
                    RETURNING *`,
                    [
                        entity_type,
                        entity_id,
                        req.file.originalname,
                        storagePath,
                        req.file.mimetype,
                        req.file.size,
                        uploaded_by || null
                    ]
                );
            }


            // =========================
            // PUBLIC URL
            // =========================

            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(storagePath);


            res.status(200).json({
                success: true,
                ...result.rows[0],
                url: data.publicUrl
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // =========================
    // UPDATE ATTACHMENT
    // =========================

    async updateAttachment(req, res) {

        try {

            const {
                file_name,
                content_type,
                size_bytes
            } = req.body;


            // Validate content_type if provided

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
                "application/pdf"
            ];

            if (
                content_type !== undefined &&
                !allowedTypes.includes(content_type)
            ) {

                return res.status(400).json({
                    error: "Unsupported content type"
                });
            }


            // Validate size if provided

            if (
                size_bytes !== undefined &&
                size_bytes !== null &&
                size_bytes > 26214400
            ) {

                return res.status(400).json({
                    error: "File cannot exceed 25 MB"
                });
            }


            const result = await db.query(
                `UPDATE attachments
                 SET
                    file_name = COALESCE($1, file_name),
                    content_type = COALESCE($2, content_type),
                    size_bytes = COALESCE($3, size_bytes)
                 WHERE id = $4
                 RETURNING *`,
                [
                    file_name,
                    content_type,
                    size_bytes,
                    req.params.attachmentid
                ]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    error: "Attachment not found"
                });
            }


            const attachment = result.rows[0];

            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(
                    attachment.url
                );


            res.json({
                ...attachment,
                url: data.publicUrl
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    },


    // =========================
    // DELETE ATTACHMENT
    // =========================

    async deleteAttachment(req, res) {

        try {

            const result = await db.query(
                `SELECT *
                 FROM attachments
                 WHERE id = $1`,
                [req.params.attachmentid]
            );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    error: "Attachment not found"
                });
            }


            const attachment = result.rows[0];


            // =========================
            // DELETE STORAGE FILE
            // =========================

            const { error: storageError } =
                await supabase.storage
                    .from(BUCKET_NAME)
                    .remove([
                        attachment.url
                    ]);


            if (storageError) {
                throw storageError;
            }


            // =========================
            // DELETE DATABASE ROW
            // =========================

            const deleted = await db.query(
                `DELETE FROM attachments
                 WHERE id = $1
                 RETURNING *`,
                [req.params.attachmentid]
            );


            res.json({
                success: true,
                attachment: deleted.rows[0]
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    }
};


module.exports = {
    attachmentController
};