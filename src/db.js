import mongo from "mongodb";

let connection_string =
  "mongodb+srv://admin:admin@cluster0.wtjo4.mongodb.net/TourMeIn?retryWrites=true&w=majority";

let client = new mongo.MongoClient(connection_string, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db = null;

export default () => {
  return new Promise((resolve, reject) => {
    if (db && client.isConnected()) {
      resolve(db);
    }

    client.connect((err) => {
      if (err) {
        reject("Doslo je do greske " + err);
      } else {
        //console.log("Uspjesno spajanje na bazu");
        db = client.db("TourMeIn");
        resolve(db);
      }
    });
  });
};
