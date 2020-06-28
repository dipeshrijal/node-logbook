const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const cors = require('cors');
// const CONNECTION_URL = "mongodb+srv://test:test@sbx-nkmpm.azure.mongodb.net/logbook?retryWrites=true&w=majority";
const CONNECTION_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "logbook";
const _ = require('lodash');


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

    let ticker = await collection.find({ "ticker": request.body.ticker }).toArray();

    // let type = request.body.type.trim();

    let type = "Buy";

    if (request.body.type.startsWith("Sold")) {
        type = "Sell"
    }

    if (ticker.length > 0) {
        collection.updateOne(
            { ticker: request.body.ticker },
            {
                $push: {
                    transactions: {
                        amount: request.body.amount,
                        price: Math.abs(request.body.price),
                        broker: request.body.broker,
                        type: type
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
        let obj = {
            ticker: request.body.ticker,
            transactions: [
                {
                    amount: request.body.amount,
                    price: Math.abs(request.body.price),
                    broker: request.body.broker,
                    type: type
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

});

app.get("/", (request, response) => {
    // response.json({ name: "good" })
    collection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.get("/:id", (request, response) => {
    collection.find({ ticker: request.params.id }).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
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