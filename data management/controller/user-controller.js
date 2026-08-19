const db = require("../../db_connection");
const argon2 = require("argon2");

exports.userController = {
  async getUsers(req, res) {
    try {
      const result = await db.query(
        `SELECT
          id,
          username,
          email,
          name,
          role,
          supplier_id,
          last_login_at,
          created_at,
          approved
         FROM users
         ORDER BY created_at DESC`
      );

      res.json(result.rows);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message
      });
    }
  },
  async getUser(req, res) {
    const { userid } = req.params;

    try {
      const result = await db.query(
        `SELECT
          id,
          username,
          email,
          name,
          role,
          supplier_id,
          last_login_at,
          created_at,
          approved
         FROM users
         WHERE id = $1`,
        [userid]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({
          error: "User not found"
        });
      }

      res.json(user);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message
      });
    }
  },
  async addUser(req, res) {
    const {
      username,
      email,
      password,
      name
    } = req.body;

    try {
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "Username, email and password are required"
        });
      }

      const role = "viewer";
      const supplier_id = null;
      const approved = false;

      const password_hash = await argon2.hash(password, {
        type: argon2.argon2id
      });

      const result = await db.query(
        `INSERT INTO users (
          username,
          email,
          password_hash,
          name,
          role,
          supplier_id,
          approved
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          username,
          email,
          name,
          role,
          supplier_id,
          last_login_at,
          created_at,
          approved`,
        [
          username,
          email,
          password_hash,
          name,
          role,
          supplier_id,
          approved
        ]
      );

      res.status(201).json({
        success: true,
        user: result.rows[0]
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },
  async login(req, res) {
    const {
      username,
      password
    } = req.body;

    try {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username and password are required"
        });
      }

      const result = await db.query(
        `SELECT
          id,
          username,
          email,
          password_hash,
          name,
          role,
          supplier_id,
          last_login_at,
          created_at,
          approved
         FROM users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password"
        });
      }

      const user = result.rows[0];

      const validPassword = await argon2.verify(
        user.password_hash,
        password
      );

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password"
        });
      }

      if (!user.approved) {
        return res.status(403).json({
          success: false,
          error: "Please get account approved by the owner"
        });
      }

      await db.query(
        `UPDATE users
         SET last_login_at = now()
         WHERE id = $1`,
        [user.id]
      );

      delete user.password_hash;

      res.json({
        success: true,
        user
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },
  async updateUser(req, res) {
    const { userid } = req.params;

    const {
      username,
      email,
      password,
      name,
      role,
      supplier_id,
      last_login_at,
      approved
    } = req.body;

    try {
      if (!role) {
        return res.status(400).json({
          success: false,
          error: "Role is required"
        });
      }

      if (role === "supplier" && !supplier_id) {
        return res.status(400).json({
          success: false,
          error: "Supplier users must have a supplier_id"
        });
      }

      const normalizedSupplierId =
        role === "supplier"
          ? supplier_id
          : null;

      let result;

      if (password) {
        const password_hash = await argon2.hash(password, {
          type: argon2.argon2id
        });

        result = await db.query(
          `UPDATE users
           SET
             username = $1,
             email = $2,
             password_hash = $3,
             name = $4,
             role = $5,
             supplier_id = $6,
             last_login_at = $7,
             approved = $8
           WHERE id = $9
           RETURNING
             id,
             username,
             email,
             name,
             role,
             supplier_id,
             last_login_at,
             created_at,
             approved`,
          [
            username,
            email,
            password_hash,
            name,
            role,
            normalizedSupplierId,
            last_login_at,
            approved,
            userid
          ]
        );

      } else {
        result = await db.query(
          `UPDATE users
           SET
             username = $1,
             email = $2,
             name = $3,
             role = $4,
             supplier_id = $5,
             last_login_at = $6,
             approved = $7
           WHERE id = $8
           RETURNING
             id,
             username,
             email,
             name,
             role,
             supplier_id,
             last_login_at,
             created_at,
             approved`,
          [
            username,
            email,
            name,
            role,
            normalizedSupplierId,
            last_login_at,
            approved,
            userid
          ]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        user: result.rows[0]
      });

    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },
  async deleteUser(req, res) {
    const { userid } = req.params;

    try {
      const result = await db.query(
        `DELETE FROM users
         WHERE id = $1
         RETURNING
           id,
           username,
           email,
           name,
           role,
           supplier_id,
           last_login_at,
           created_at,
           approved`,
        [userid]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        deletedUser: true,
        user: result.rows[0]
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