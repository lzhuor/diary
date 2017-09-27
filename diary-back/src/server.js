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

let validateParams = async (ctx, next) => {
  let invalid;
  if (ctx.method === 'GET' && !ctx.request.query) {
    invalid = true;
  } else if (ctx.method === 'POST' && (!ctx.request.body || !ctx.request.body.data)) {
    invalid = true;
  }
  if (invalid) {
    ctx.response.status = 400;
    ctx.response.body = {err: 'Missing param'};
  } else {
    await next();
  }  
};

let validateOwner = async (ctx, next) => {
  let owner, errMsg;
  if (ctx.method === 'GET') {
    ({owner} = ctx.request.query);
  } else {
    ({owner} = ctx.request.body && ctx.request.body.data);
  }
  if (!owner) {
    errMsg = 'Missing param';
  } else if (!/^[A-Za-z0-9]+$/.test(owner)) {
    errMsg = 'Illegal param';
  }
  if (errMsg) {
    ctx.response.status = 400;
    ctx.response.body = {err: errMsg};
  } else {
    await next();
  }
};

/**
 * returns a list of entries for specified date, or empty
 * @param {*} req req.query.date req.query.owner
 * @param {*} res 
 */
const getEntries = async (ctx, next) => {
  const { date, owner } = ctx.request.query;
  if (!date) {
    ctx.response.status = 400;
    ctx.response.body = {err: 'Missing param'};
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    ctx.response.status = 400;
    ctx.response.body = {err: 'Illegal param'};
    return;
  }
  let ownerEntryCollection = db.collection(`entry_${owner}`);
  let results = await (await ownerEntryCollection.find({date})).toArray();
  ctx.response.body = {data: results};
};

/**
 * add a new entry to date, or update an existing entry
 * - if new, your entry must have no _id
 * - if update, your entry must have _id. If that _id is not found, nothing happens
 * - if new entry is identical to old, nothing happens
 * @param {*} req req.body.data.entry req.query.owner
 * @param {*} res 
 */
const postEntry = async (ctx, next) => {
  let {entry, owner} = ctx.request.body.data
  if (!entry) {
    ctx.response.status = 400;
    ctx.response.body = {err: 'Missing param'};
    return;
  }

  let ownerEntryCollection = db.collection(`entry_${owner}`);  
  if (!entry._id) {
    let result = await ownerEntryCollection.insertOne(entry);
    ctx.response.status = 200;
    ctx.response.body = {data: {entry}};
    return;
  } else {
    let result = await ownerEntryCollection.updateOne({_id: entry._id},
      {$set: {...entry}});
    ctx.response.status = 200;
    ctx.response.body = {data: result};
    return;
  }
};

const main = async (opt = {}) => {
  app = new Koa(koaBody());
  const dbName = opt.dbName || dairy;
  const mongoUrl = `mongodb://localhost:27017/${dbName}`;
  db = await MongoClient.connect(mongoUrl);
  
  app.use(logger());
  app.use(koaBody());
  app.use(async (ctx, next) => {
    ctx.response.type = 'json';
    await next();
  });
  router.use(['/api/getEntries', '/api/postEntry'], validateParams);
  router.use(['/api/getEntries', '/api/postEntry'], validateOwner);
  router.get('/api/getEntries', getEntries);
  router.post('/api/postEntry', postEntry);
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