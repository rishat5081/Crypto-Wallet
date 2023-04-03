var MongoClient = require("mongodb").MongoClient;
function connectionDatabase() {
  return new Promise((resolve, reject) => {
    var url = "";
    MongoClient.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      async (err, client) => {
        if (err) {
          reject(err);
        } else {
          console.log("Mongo is conected!!");
          const db = client.db("freedom-finance");
          resolve(db);
        }
      }
    );
  });
}
module.exports = connectionDatabase();
