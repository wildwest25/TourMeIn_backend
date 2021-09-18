import connect from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

(async () => {
  let db = await connect();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
})();

export default {
  async register(userdata) {
    let db = await connect();
    let doc = {
      email: userdata.email,
      password: await bcrypt.hash(userdata.password, 8),
      firstname: userdata.firstname,
      lastname: userdata.lastname,
      gender: userdata.gender,
      dob: userdata.dob,
      country: userdata.country,
      isguide: userdata.isguide,
      city: userdata.city,
      phone: userdata.phone,
      languages: userdata.languages,
      ivisited: userdata.ivisited,
      wouldvisit: userdata.wouldvisit,
      aboutme: userdata.aboutme,
      monuments: userdata.monuments,
      starthour: userdata.starthour,
      startminute: userdata.startminute,
      endhour: userdata.endhour,
      endminute: userdata.endminute,
      monday: userdata.monday,
      tuesday: userdata.tuesday,
      wednesday: userdata.wednesday,
      thursday: userdata.thursday,
      friday: userdata.friday,
      saturday: userdata.saturday,
      sunday: userdata.sunday,
      perhour: userdata.perhour,
      perlandmark: userdata.perlandmark,
      costhour: userdata.costhour,
      costlandmark: userdata.costlandmark,
      currency: userdata.currency,
      fblink: userdata.fblink,
      twlink: userdata.twlink,
      instalink: userdata.instalink,
      Picture: userdata.Picture,
    };
    let tourdoc = {
      user: userdata.email,
      guide: userdata.guide,
      name: userdata.name,
      guidename: userdata.guidename,
      accepted: "waiting",
      guideimage: userdata.guideimage,
      userimage: userdata.userimage,
    };
    try {
      let tourResult = await db.collection("tour").insertOne(tourdoc);

      let result = await db.collection("users").insertOne(doc);
      if (result && result.insertedId) {
        return result.insertedId;
      }
    } catch (e) {
      if (e.name == "MongoError" && e.code == 11000) {
        throw new Error("Korisnik već postoji");
      }
    }
  },

  async loginUser(email, password) {
    let db = await connect();
    let user = await db.collection("users").findOne({
      email: email,
    });
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      delete user.password;
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: "HS512",
        expiresIn: "1 week",
      });
      return {
        token,
        email: user.email,
      };
    } else {
      throw new Error("Neuspješna prijava");
    }
  },

  verify(req, res, next) {
    try {
      let authorization = req.headers.authorization.split(" ");
      let type = authorization[0]; //bearer token
      let token = authorization[1];
      if (type !== "Bearer") {
        res.status(401).send();
        return false;
      } else {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET);
        return next();
      }
    } catch (e) {
      console.log("Nedopušten pristup");
      return res.status(401).send();
    }
  },
};
