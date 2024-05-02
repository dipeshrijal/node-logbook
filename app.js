const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const cors = require('cors');
// const CONNECTION_URL = "mongodb+srv://logbook:logbook@sbx.nkmpm.azure.mongodb.net/<dbname>?retryWrites=true&w=majority";

const CONNECTION_URL = "mongodb+srv://logbook:logbook@logbook.eyaj0tg.mongodb.net/?retryWrites=true&w=majority&appName=logbook";

// const CONNECTION_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "logbook";
const _ = require('lodash');
console.log("test")

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors());
var database, collection;

app.listen(4000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true, }, (error, client) => {
        if (error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("logs");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/health", (request, response) => {
    console.log("health request accepted")
    response.send({ healthy: true });
})

app.get("/clean", (request, response) => {
    collection.remove({});
    response.send({ "remove": true });
})

// app.post("/import", (request, response) => {
//     console.log(request.body);
//     collection.insertOne(request.body, (error, result) => {
//         if (error) {
//             return response.status(500).send(error);
//         }
//         response.send(result.result);
//     });
// });

app.post("/import", async (request, response) => {

    let t = request.body.ticker.split(" ")[0];
    let ticker = await collection.find({ "ticker": t }).toArray();
    let action = "Buy";

    if (request.body.description.startsWith("Sold")) {
        action = "Sell"
    }

    if (ticker.length > 0) {
        collection.updateOne(
            { ticker: t },
            {
                $push: {
                    transactions: {
                        quantity: request.body.quantity,
                        description: request.body.description,
                        amount: request.body.amount,
                        action: action,
                        price: request.body.price,
                        broker: request.body.broker,
                        date: new Date(request.body.date),
                        commission: request.body.commission,
                        regfee: request.body.fee
                    }
                }
            }
            , (error, result) => {
                if (error) {
                    return response.status(500).send(error);
                }
                response.send(result.result);
            });
    } else {
        if (t === "{{SYMBOL}}") {
            response.send({ "result": "No Match" })
        } else {
            let obj = {
                ticker: t,
                transactions: [
                    {
                        quantity: request.body.quantity,
                        amount: request.body.amount,
                        description: request.body.description,
                        action: action,
                        price: request.body.price,
                        broker: request.body.broker,
                        date: new Date(request.body.date),
                        commission: request.body.commission,
                        regfee: request.body.fee
                    }
                ]
            }
            collection.insertOne(obj, (error, result) => {
                if (error) {
                    return response.status(500).send(error);
                }
                response.send(result.result);
            });
        }

    }

});

app.get("/", (request, response) => {

    let query = request.query.query;
    let date = request.query.date

    if (query) {
        collection.find({ ticker: query }).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.send(result);
        });
    } else if (date) {
        let date1 = new Date(date);

        collection.find({ "transactions.date": { $gte: date1 } }).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.send(result);
        });
    } else {
        collection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.send(result);
        });
    }
});

app.get("/:id", (request, response) => {

    let date = request.query.date

    if (date) {
        let date1 = new Date(date);

        collection.find({ ticker: request.params.id, "transactions.date": { $gte: date1 } }).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            console.log(result.transactions)
            response.send(result);
        });

    } else {
        collection.find({ ticker: request.params.id }).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.send(result);
        });
    }



});


app.post("/", (request, response) => {
    collection.insertOne(request.body, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});

app.put("/:id", (request, response) => {
    let updatedVal = _.omit(request.body, ['_id']);
    collection.updateMany({ _id: ObjectId(request.params.id) }, {
        $set: updatedVal
    }, (error, result) => {
        if (error) {
            console.log(error)
            return response.status(500).send(error);
        }
        console.log(result.result)
        response.send(result.result);
    });
});