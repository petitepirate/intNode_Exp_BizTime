const express = require("express");
const { default: slugify } = require("slugify");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const companiesQuery = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: companiesQuery.rows });
  } catch(e) {
    return next(e);
  }
})

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, {lower: true});
    const newCompany = await db.query(`INSERT INTO companies (code, name, description)
                                      VALUES ($1, $2, $3)
                                      RETURNING code, name, description`, 
                                      [code, name, description]);
    return res.status(201).json({ company: newCompany.rows[0]});
  } catch(e) {
    return next(e);
  }
})

router.get("/:code", async (req, res, next) => {
  try {
    const companyQuery = await db.query(`SELECT code, description, name FROM companies WHERE code = $1`, [req.params.code]);

    if(companyQuery.rows.length === 0) {
      throw new ExpressError(`There is no company with code '${req.params.code}'`, 404);
    }
    const { code, description, name } = companyQuery.rows[0];
    return res.json({ company: { code, description, name } });
  } catch(e) {
    return next(e);
  }
})

router.put("/:code", async (req, res, next) => {
  try {
    const query = await db.query(`SELECT code, description, name FROM companies WHERE code = $1`, [req.params.code]);
    if(query.rows.length === 0) {
      throw new ExpressError(`There is no company with code '${req.params.code}'`, 404);
    }
    const result = await db.query(`UPDATE companies
                                  SET description=$1, name=$2
                                  WHERE code = $3
                                  RETURNING code, name, description`, 
                                  [req.body.description, req.body.name, req.params.code]);
    const { code, description, name } = result.rows[0];
    return res.json({ company: { code, description, name } });

  } catch(e) {
    return next(e);
  }
})

router.delete("/:code", async function(req, res, next) {
  try {
    const result = await db.query(
      "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
