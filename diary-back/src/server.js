const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const http = require('http');
const destroyable = require('server-destroy');
const Koa = require('koa');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const router = require('koa-router')();
const config = require('./config.js');

let app, db;

/**
 * returns a list of entries for specified date, or empty
 * @param {*} req req.query.date
 * @param {*} res 
 */
const getEntriesForDate = async (ctx, next) => {
  const { date, owner } = ctx.request.query;
  if (!date || !owner) {
    ctx.response.status = 400;
    ctx.response.body = {err: 'Missing query param'};
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[A-Za-z0-9]+$/.test(owner)) {
    ctx.response.status = 400;
    ctx.response.body = {err: 'Illegal query param'};
    return;
  }
  let ownerEntryCollection = db.collection(`entry_${owner}`);
  let results = await (await ownerEntryCollection.find({date})).toArray();
  ctx.response.body = {data: results};
};

/**
 * add a new entry to date, or update an existing entry
 * - if new, your entry must have no _id
 * - if update, your entry must have _id. If that _id is not found, will give err
 * @param {*} req req.body.entry
 * @param {*} res 
 */
const postEntryForDate = async (ctx, next) => {
  if (!req.body) {
    res.status(400).json({
      err: 'Missing body',
    });
    return;
  }
  const {
    entry,
  } = req.body;
  if (!entry) {
    res.status(400).json({
      err: 'Missing params in json',
    });
    return;
  }
  if (entry._id) {
    const newEntry = Object.assign({}, entry);
    delete newEntry._id;
    entryCollection.updateOne({
      _id: ObjectId(entry._id),
    }, newEntry)
      .then((result) => {
        res.status(200).json({
          data: result.toString(),
        });
      })
      .catch((err) => {
        res.status(500).json({
          err: err.toString(),
        });
      });
  } else {
    entryCollection.insertOne(entry)
      .then((result) => {
        res.status(200).json({
          data: result.toString(),
        });
      })
      .catch((err) => {
        res.status(500).json({
          err: err.toString(),
        });
      });
  }
};

const main = async (opt = {}) => {
  app = new Koa(koaBody());
  const dbName = opt.dbName || dairy;
  const mongoUrl = `mongodb://localhost:27017/${dbName}`;
  db = await MongoClient.connect(mongoUrl);
  
  app.use(logger());
  app.use(koaBody());
  app.use((ctx, next) => {
    ctx.response.type = 'json';
    return next();
  });
  router.get('/api/getEntriesForDate', getEntriesForDate);
  router.post('/api/postEntryForDate', postEntryForDate);
  app.use(router.routes());
  app.use(router.allowedMethods());
  
  return new Promise(resolve => {
    let server = http.createServer(app.callback());
    server.listen(config.port, () => {
      console.log(`Listening on ${config.port}`);
      app.dbConnection = db;
      destroyable(server);
      app.httpServer = server;
      resolve(app);
    });
  });
};

if (require.main === module) {
  main();
} else {
  module.exports = main;
}