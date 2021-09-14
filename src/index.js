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
  //console.log(email);

  let result = await db.collection("users").findOne({ email: email });

  res.json(result);
  //console.log(result);
});

app.get("/guide/:guide", async (req, res) => {
  let db = await connect();
  let guide = req.params.guide;

  //console.log(guide);

  let result = await db.collection("users").find({ isguide: guide });

  let cursor = await result.toArray();

  res.json(cursor);
});

app.post("/test", [auth.verify], async (req, res) => {
  res.json({ status: "OK" });
});

app.get("/search/:guides", async (req, res) => {
  let db = await connect();
  let query = req.query;
  let guide = req.params.guide;

  let selekcija = {};

  if (query.name) {
    selekcija.name = new RegExp(query.name);
  }

  if (query.name2) {
    let pretraga = query.name2;
    let terms = pretraga.split(" ");

    selekcija = {
      $and: [],
    };

    terms.forEach((term) => {
      //console.log("unutar petelje", term);
      let or = {
        $or: [{ city: new RegExp(term) }],
      };

      selekcija.$and.push(or);
    });
  }

  let cursor = await db
    .collection("users")
    .find({ selekcija }, { isguide: guide });
  let results = await cursor.toArray();
  //console.log(results);

  res.json(results);
});
