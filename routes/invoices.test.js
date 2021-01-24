// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
    companies (code, name, description) VALUES ('test-company', 'Test Company', 'Company made for testing things.')
    RETURNING code, name, description`);
  testCompany = result.rows[0]; 
  let invResult = await db.query(`
    INSERT INTO
      invoices (comp_code, amt, paid, add_date) VALUES ('test-company', '5', 'false', '1/1/2020')
      RETURNING comp_code, amt, paid, add_date, paid_date, id`);
  testInvoice = invResult.rows[0];
});

afterEach(async function() {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async function() {
  await db.end();
});

describe("GET /invoices", function() {
  test("Gets invoices", async function() {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoices: [{
                id: testInvoice.id,
                comp_code: testInvoice.comp_code
      }]
    });
  });
});

describe("POST /invoices", function() {
  test("Adds a new invoice", async function() {
    const newInvoice = {
      comp_code: testCompany.code,
      amt: 10,
    };
    const response = await request(app).post("/invoices").send(newInvoice);
    expect(response.statusCode).toEqual(201);
  });
});

describe("GET /invoices/:id", function() {
  test("Gets a single invoice", async function() {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: testInvoice.id,
        company: {
          code: testCompany.code,
          name: testCompany.name,
          description: testCompany.description,
        },
        amt: testInvoice.amt,
        paid: testInvoice.paid,
        add_date: testInvoice.add_date.toString(),
        paid_date: testInvoice.paid_date,
      }
    });
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("PUT /invoices/:id", function() {
  test("Edits a company", async function() {
    const editedInvoice = {
      id: testInvoice.id,
      amt: 5,
      paid: true,
    };
    const response = await request(app).put(`/invoices/${testInvoice.id}`).send(editedInvoice);
    expect(response.statusCode).toEqual(200);
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).put(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /invoices/:id", function() {
  test("Deletes an invoice", async function() {
    const response = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).put(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
