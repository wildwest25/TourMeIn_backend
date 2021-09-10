import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connect from "./db.js";
import auth from "./auth.js";

const app = express();

app.use(cors());

const port = 3000;
app.use(express.json());

app.listen(port, () => {
  console.log("Server on port ", port);
});

app.post("/users", async (req, res) => {
  let user = req.body;
  let id;
  try {
    id = await auth.register(user);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  return res.json({ id: id });
});

app.patch("/users/:email", async (req, res) => {
  let email = req.params.email;
  let data = req.body;

  let db = await connect();

  let result = await db.collection("users").updateOne(
    { email: email },
    {
      $set: data,
    }
  );
  //console.log(data, email)
  if (result && result.modifiedCount == 1) {
    let doc = await db.collection("users").findOne({ email: email });
    res.json(doc);
  } else {
    res.json({
      status: "fail",
    });
  }
});

app.post("/auth", async (req, res) => {
  let user = req.body;
  try {
    let result = await auth.loginUser(user.email, user.password);
    res.json(result);
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
});

app.get("/users/:email", async (req, res) => {
  let db = await connect();
  let email = req.params.email;

  let result = await db.collection("users").findOne({ email: email });

  res.json(result);
  //console.log(result);
});

app.post("/test", [auth.verify], async (req, res) => {
  res.json({ status: "OK" });
});
