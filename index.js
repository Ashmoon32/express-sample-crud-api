const express = require('express');
const app = express();

const { MongoClient, ObjectId } = require('mongodb');
const mongo = new MongoClient('mongodb://localhost');
const db = mongo.db('travel');

const bodyParser = require('body-parser');

const cors = require('cors');
app.use(cors());

const {
    body,
    param,
    validationResult
} = require('express-validator');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('query parser', 'extended');

// manually set CORS headers
// app.use(function(req, res, next) {
//  res.append("Access-Control-Allow-Origin", "*");
//  res.append("Access-Control-Allow-Methods", "*");
//  res.append("Access-Control-Allow-Headers", "*");
//  next();
// });




app.get('/api/records', async function (req, res) {

    const options = req.query;

    const sort = options.sort ||  {};
    const filter = options.filter || {};
    const limit = 10;
    const page = parseInt(options.page) || 1;
    const skip = (page -1) * limit;

    for ( i in sort) {
        sort[i] = parseInt(sort[i]);
    }

    try {
        const result = await db
        .collection('records')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

        res.json({
            meta: { 
                skip,
                limit,
                sort,
                filter,
                page,
                total: result.length },
            data: result,
            links: {
                self: req.originalUrl,
            }
        });

    } catch {
        res.sendStatus(500);
    }
});

app.post('/api/records',
    [
        body('name').not().isEmpty(),
        body('from').not().isEmpty(),
        body('to').not().isEmpty(),
    ],
    async function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array()
            });
        }

        try {
            const result = await db
            .collection('records')
            .insertOne(req.body);

            const _id = result.insertedId;

            res.append("Location", "/api/records/" + _id);
            res.status(201).json({
                meta: { _id},
                data: result,
            });
        } catch {
            res.sendStatus(500);
        }
    }
);

app.put("/api/records/:id", async function (req, res) {
try {
    const _id = new ObjectId(req.params.id);
    const result = await db
    .collection("records")
    .findOneAndReplace(
        { _id },
        req.body,
        { returnDocument: "after"
    });
    res.json({
        meta: { _id },
    data: result.value,
    });
} catch {
    res.sendStatus(500);
}
});


app.patch('/api/records/:id', async function (req, res) {
    try {
        const _id = new ObjectId(req.params.id);

        const result = await db
        .collection('records')
        .findOneAndUpdate(
            { _id },
            { $set: req.body },
            { returnDocument: "after" }
        );

        res.json({
            meta: { _id },
            data: result.value
        });
        } catch {
            res.sendStatus(500);
        }
});

app.delete('/api/records/:id', async function (req, res) {
    try {
        const _id = new ObjectId(req.params.id);

        const result = await db
        .collection('records')
        .deleteOne({ _id });
        res.sendStatus(204);
    } catch {
        res.sendStatus(500);
    }
});

// to test
app.get('/test', function (req, res) {
    return res.json(req.query);
});

app.listen(8000, function () {
    console.log('Server running at port 8000...');
});