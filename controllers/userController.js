const { sql, poolPromise } = require("../config/db");

exports.getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM users");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.createUser = async (req, res) => {
    const { name, email } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .query("INSERT INTO users (name, email) VALUES (@name, @email)");

        res.send("User created");
    } catch (err) {
        res.status(500).send(err.message);
    }
};