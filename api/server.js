import express from "express";
import jsforce from "jsforce";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import serverless from "serverless-http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

let oauth2 = new jsforce.OAuth2({
  loginUrl: "https://login.salesforce.com",
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  redirectUri: process.env.SF_CALLBACK_URL,
});

let conn;

app.use(express.static(path.join(__dirname, "../public")));

// --- Salesforce Login ---
app.get("/api/auth/login", (req, res) => {
  res.redirect(oauth2.getAuthorizationUrl({ scope: "full refresh_token api" }));
});

// --- Salesforce OAuth Callback ---
app.get("/api/oauth2/callback", (req, res) => {
  const code = req.query.code;
  conn = new jsforce.Connection({ oauth2 });
  conn.authorize(code, (err, userInfo) => {
    if (err) return res.send("Error: " + err);
    res.redirect("/api/objects");
  });
});

// --- List Objects ---
app.get("/api/objects", async (req, res) => {
  if (!conn) return res.redirect("/api/auth/login");

  try {
    const globalDesc = await conn.describeGlobal();
    const objects = globalDesc.sobjects.map(o => ({
      name: o.name,
      label: o.label,
      custom: o.custom,
    }));

    let html = `
      <h1>Salesforce Objects</h1>
      <p>Total Objects: ${objects.length}</p>
      <ul>
        ${objects
          .map(
            o =>
              `<li><a href="/api/objects/${o.name}">${o.label}</a> (${o.name}) ${
                o.custom ? "(Custom)" : ""
              }</li>`
          )
          .join("")}
      </ul>
      <a href="/">Back</a>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error fetching objects: " + err);
  }
});

// --- Describe Object Fields ---
app.get("/api/objects/:objectName", async (req, res) => {
  if (!conn) return res.redirect("/api/auth/login");

  const objectName = req.params.objectName;

  try {
    const meta = await conn.sobject(objectName).describe();
    const fields = meta.fields.map(f => ({
      name: f.name,
      label: f.label,
      type: f.type,
      length: f.length,
      nillable: f.nillable,
      picklistValues: f.picklistValues?.map(p => p.value),
    }));

    let html = `
      <h1>${meta.label} (${meta.name})</h1>
      <p>Total Fields: ${fields.length}</p>
      <table border="1" cellspacing="0" cellpadding="5">
        <tr>
          <th>Label</th>
          <th>API Name</th>
          <th>Type</th>
          <th>Length</th>
          <th>Required</th>
          <th>Picklist Values</th>
        </tr>
        ${fields
          .map(
            f => `
          <tr>
            <td>${f.label}</td>
            <td>${f.name}</td>
            <td>${f.type}</td>
            <td>${f.length || "-"}</td>
            <td>${f.nillable ? "No" : "Yes"}</td>
            <td>${f.picklistValues?.join(", ") || "-"}</td>
          </tr>`
          )
          .join("")}
      </table>
      <br>
      <a href="/api/objects">← Back to all objects</a>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error fetching fields: " + err);
  }
});

// --- Root Route ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

export default serverless(app);

