// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('test-company', 'Test Company', 'Company made for testing things.')
      RETURNING code, name, description`);
  testCompany = result.rows[0];
});

afterEach(async function() {
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  await db.end();
});

describe("GET /companies", function() {
  test("Gets companies", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name,
      }]
    });
  });
});

// describe("POST /companies", function() {
//   test("Adds a new company", async function() {
//     const newCompany = {
//       code: 'new-company',
//       name: 'New Company',
//       description: 'New Description'
//     };
//     const response = await request(app).post("/companies").send(newCompany);
//     expect(response.statusCode).toEqual(201);
//     expect(response.body).toEqual({ company: newCompany });
//   });
// });

describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
      }
    });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

// describe("PUT /companies/:code", function() {
//   test("Edits a company", async function() {
//     const editedCompany = {
//       code: 'testco',
//       name: 'Edited Name',
//       description: 'Edited Description'
//     };
//     const response = await request(app).put(`/companies/${editedCompany.code}`).send(editedCompany);
//     expect(response.statusCode).toEqual(200);
//     expect(response.body).toEqual({ company: editedCompany });
//   });

//   test("Responds with 404 if can't find company", async function() {
//     const response = await request(app).put(`/companies/0`);
//     expect(response.statusCode).toEqual(404);
//   });
// });

describe("DELETE /companies/:code", function() {
  test("Deletes a company", async function() {
    const response = await request(app).delete(`/companies/${testCompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).put(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});
