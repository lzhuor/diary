require('isomorphic-fetch');
const { MongoClient } = require('mongodb');
const config = require('./config.js');
const dbName = 'dairyTest';
const mongoUrl = `mongodb://localhost:27017/${dbName}`;
let appInstance, db;

beforeAll(async () => {
  db = await MongoClient.connect(mongoUrl);
  appInstance = await require('./server.js')({dbName});
});

let expectFetchUrlStatusCodeAndJson = async ({url, expectStatusCode, expectJson,
    method, postBody}) => {
  let response;
  if (!method)
    response = await fetch(url);
  else if (method === 'POST') {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      method,
      body: JSON.stringify(postBody)
    });
  }
  expect(response.status).toBe(expectStatusCode);
  let body = await response.json();
  if (expectJson)
    expect(body).toEqual(expectJson);
  return body;
}

test('/api/getEntriesForDate require date and owner params', async () => {
  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/getEntriesForDate`,
    expectStatusCode: 400, expectJson: {err: 'Missing query param'}});

  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/getEntriesForDate?owner=testOwner`,
    expectStatusCode: 400, expectJson: {err: 'Missing query param'}});
  
  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/getEntriesForDate?date=1970-01-01`,
    expectStatusCode: 400, expectJson: {err: 'Missing query param'}});
});

test('/api/getEntriesForDate require date and owner params legal', async () => {
  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/getEntriesForDate?owner=_admin&date=1970-01-01`,
    expectStatusCode: 400, expectJson: {err: 'Illegal query param'}});

  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/getEntriesForDate?owner=testOwner&date=1234`,
    expectStatusCode: 400, expectJson: {err: 'Illegal query param'}});
});

test('/api/getEntriesForDate returns a entry', async () => {
  let testOwnerEntryCollection = db.collection(`entry_testOwner`);
  let entry = {_id: 'testid', date: "1970-01-01", title:
    "test title", content: "test content", points: 1};
  await testOwnerEntryCollection.insertOne(entry);
  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/getEntriesForDate?date=1970-01-01&owner=testOwner`,
    expectStatusCode: 200, expectJson: {data: [entry]}});
});

test('/api/postEntryForDate needs an owner and an entry in body', async () => {
  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/postEntryForDate?owner=testOwner`,
    method: 'POST', expectStatusCode: 400, expectJson: {err: 'Missing entry'}});
  
  await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/postEntryForDate`, postBody: {},
    method: 'POST', expectStatusCode: 400, expectJson: {err: 'Missing query param'}});
});

test('/api/postEntryForDate adds an entry', async () => {
  let entry = {date: "1970-01-01", title: "test title", content: "test content", points: 1};
  let json = await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/postEntryForDate?owner=testOwner`,
    method: 'POST', postBody: {data: {entry}}, expectStatusCode: 200
  });
  let testOwnerEntryCollection = db.collection(`entry_testOwner`);
  let dbResult = await (await testOwnerEntryCollection.find({})).toArray();
  expect(dbResult).toHaveLength(1);
  expect(dbResult[0]).toEqual({_id: dbResult[0]._id, date: "1970-01-01", title: "test title",
    content:"test content", points: 1});
});

test('/api/postEntryForDate if update an entry that doesn\'t exist, give modified 0', async () => {
  let entry = {_id: '59c61d8dc8864c16acb0c422', date: "1970-01-01", title: "test title",
    content: "test content", points: 1};
  let json = await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/postEntryForDate?owner=testOwner`,
    method: 'POST', postBody: {data: {entry}}, expectStatusCode: 200,
    expectJson: {"data": {"n": 0, "nModified": 0, "ok": 1}}
  });
});

test('/api/postEntryForDate if update an entry that exists, update it', async () => {
  let entry = {_id: '59c61d8dc8864c16acb0c422', date: "1970-01-01", title: "test title",
    content: "test content", points: 1};
  let testOwnerEntryCollection = db.collection(`entry_testOwner`);    
  await testOwnerEntryCollection.insertOne(entry);

  let entryNew = Object.assign({}, entry, {title: 'updated test title',
    content: 'updated test content', points: 2});
  let json = await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/postEntryForDate?owner=testOwner`,
    method: 'POST', postBody: {data: {entry: entryNew}}, expectStatusCode: 200,
    expectJson: {"data": {"n": 1, "nModified": 1, "ok": 1}}
  });
  let entryFromDb = await (await testOwnerEntryCollection.find({_id: entry._id})).toArray();
  expect(entryFromDb).toHaveLength(1);
  expect(entryFromDb[0]).toEqual(entryNew);
});

test('/api/postEntryForDate if update an entry that exists, but all same, do nothing', async () => {
  let entry = {_id: '59c61d8dc8864c16acb0c422', date: "1970-01-01", title: "test title",
    content: "test content", points: 1};
  let testOwnerEntryCollection = db.collection(`entry_testOwner`);    
  await testOwnerEntryCollection.insertOne(entry);

  let entryNew = Object.assign({}, entry);
  let json = await expectFetchUrlStatusCodeAndJson({url:
    `http://localhost:${config.port}/api/postEntryForDate?owner=testOwner`,
    method: 'POST', postBody: {data: {entry: entryNew}}, expectStatusCode: 200,
    expectJson: {"data": {"n": 1, "nModified": 0, "ok": 1}}
  });
  let entryFromDb = await (await testOwnerEntryCollection.find({_id: entry._id})).toArray();
  expect(entryFromDb).toHaveLength(1);
  expect(entryFromDb[0]).toEqual(entryNew);
});

afterEach(async () => {
  await db.dropDatabase();
});

afterAll(async () => {
  await appInstance.httpServer.close();
  await appInstance.dbConnection.close();
  await db.close();
});