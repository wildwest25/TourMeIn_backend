import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connect from "./db.js";
import auth from "./auth.js";

const app = express();

app.use(cors());

const port = process.env.PORT || 3100;
app.use(express.json());

app.listen(port, () => {
  console.log("Server on port ", port);
});

//Registracija
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

//Update/dodaje input polja u userProfile/GuidePage
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

//Login
app.post("/auth", async (req, res) => {
  let user = req.body;
  try {
    let result = await auth.loginUser(user.email, user.password);
    res.json(result);
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
});

//Dohvaca sve iz kolekcije users po specificnom mailu
app.get("/users/:email", async (req, res) => {
  let db = await connect();
  let email = req.params.email;
  //console.log(email);

  let result = await db.collection("users").findOne({ email: email });

  res.json(result);
  //console.log(result);
});

//dohvaca cijelu kolekciju users ovisno o tome dali je guide ili ne
app.get("/guide/:guide", async (req, res) => {
  let db = await connect();
  let guide = req.params.guide;

  //console.log(guide);

  let result = await db.collection("users").find({ isguide: guide });

  let cursor = await result.toArray();

  res.json(cursor);
});

//dohvaca samo ono sta zelis iz kolekcije users ovisno o teme da li je guide ili ne
app.get("/guides/:guides", async (req, res) => {
  let db = await connect();
  let guide = req.params.guides;

  //console.log(guide);

  let result = await db.collection("users").findOne({ isguide: guide });

  res.json(result);
});

//updatea kolekciju tour
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

//prebacuje zavrsene toure u kolekciju finishedTours zbog lakseg snalazenja i dohvata
app.post("/finishtour/:email", async (req, res) => {
  let email = req.params.email;
  let data = req.body;

  let db = await connect();

  let result = await db.collection("finishedTours").insertOne(data);
  //console.log(nadimak);
  if (result && result.insertedCount == 1) {
    let doc = await db.collection("finishedTours").findOne({ user: email });
    res.json(doc);
  } else {
    res.json({
      status: "fail",
    });
  }
});

//update kolekciju tour po id-u od user-a
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

//dohvaca podatke koje zelis iz kolekcije tour ako je user = trenutni korisnik
app.get("/tour/:email", async (req, res) => {
  let db = await connect();
  let email = req.params.email;
  //console.log(user);

  let result = await db.collection("tour").findOne({ user: email });

  res.json(result);
});

//vraca cijelu kolekciju
app.get("/rated/:email", async (req, res) => {
  let db = await connect();
  let email = req.params.email;

  console.log(email);

  let result = await db
    .collection("finishedTours")
    .find({ $or: [{ user: email }, { guide: email }] });

  let cursor = await result.toArray();

  res.json(cursor);
});

//vraca sve koji su rated
app.get("/finishedTour/:guide", async (req, res) => {
  let db = await connect();
  let guide = req.params.guide;

  //console.log(rated);

  let result = await db.collection("finishedTours").find({ guide: guide });

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

app.post("/deleteFnished/:id", async (req, res) => {
  let id = req.body.id;

  let db = await connect();
  //console.log(email);
  let result = await db.collection("finishedTours").deleteOne({ id: id });

  if (result && result.deletedCount == 1) {
    res.json({ status: "Izbrisano" });
  } else {
    res.json({
      status: "fail",
    });
  }
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
