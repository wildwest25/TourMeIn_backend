import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connect from "./db.js";
import auth from "./auth.js";

const app = express();

app.use(cors());

const port = process.env.PORT || 3000;
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

app.get("/guides/:guides", async (req, res) => {
  let db = await connect();
  let guide = req.params.guides;

  //console.log(guide);

  let result = await db.collection("users").findOne({ isguide: guide });

  res.json(result);
});

app.patch("/tour/:email", async (req, res) => {
  let email = req.params.email;
  let data = req.body;

  let db = await connect();

  let result = await db.collection("tour").updateOne(
    { user: email },
    {
      $set: data,
    }
  );
  //console.log(data, email)
  if (result && result.modifiedCount == 1) {
    let doc = await db.collection("tour").findOne({ user: email });
    res.json(doc);
  } else {
    res.json({
      status: "fail",
    });
  }
});

app.patch("/tours/:id", async (req, res) => {
  let id = req.params.id;
  let data = req.body;

  let db = await connect();

  let result = await db.collection("tour").updateOne(
    { id: id },
    {
      $set: data,
    }
  );
  //console.log(data, email)
  if (result && result.modifiedCount == 1) {
    let doc = await db.collection("tour").findOne({ id: id });
    res.json(doc);
  } else {
    res.json({
      status: "fail",
    });
  }
});

app.get("/tour/:email", async (req, res) => {
  let db = await connect();
  let email = req.params.email;
  //console.log(user);

  let result = await db.collection("tour").findOne({ user: email });

  res.json(result);
});

//vraca sve koji su rated
app.get("/rated/:rate", async (req, res) => {
  let db = await connect();
  let rated = req.params.rate;

  //console.log(rated);

  let result = await db.collection("tour").find({ accepted: rated });

  let cursor = await result.toArray();

  res.json(cursor);
});

//vraca sve gdje je guide = currentuser
app.get("/tours/:guide", async (req, res) => {
  let db = await connect();
  let guide = req.params.guide;
  //console.log(user);

  let result = await db.collection("tour").findOne({ guide: guide });

  res.json(result);
});

//vraca sve gdje je user = currentuser
app.get("/tourss/:user", async (req, res) => {
  let db = await connect();
  let user = req.params.user;
  //console.log(user);

  let result = await db.collection("tour").findOne({ user: user });

  res.json(result);
});

//SEARCH
app.get("/search/:guides", async (req, res) => {
  let db = await connect();
  let query = req.query;
  let guide = req.params.guides;

  //console.log(guide);

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
    .find({ $and: [selekcija, { isguide: guide }] });
  let results = await cursor.toArray();
  //console.log(results);

  res.json(results);
});
