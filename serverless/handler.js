'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB();
const GeoPoint = require('geopoint')
const ddbGeo = require('dynamodb-geo');
const geoConfig = new ddbGeo.GeoDataManagerConfiguration(dynamoDb, process.env.DYNAMODB_TABLE);
geoConfig.hashKeyLength = 3;
geoConfig.longitudeFirst = false;
const geoTableManager = new ddbGeo.GeoDataManager(geoConfig);

const hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

const within = async event => {
  let {latitude, longitude, distance} = JSON.parse(event.body)

  let message, code;
  try{
    const result = await geoTableManager.queryRadius({
      RadiusInMeter: distance,
      CenterPoint: {
          latitude,
          longitude
      }
    })
    code = 200
    message = `Retrieved items ${JSON.stringify(result)}`
  }
  catch(err){
    code = 500
    message = `Error fetching record: ${err.message}`
  }
  return {
    statusCode: code,
    body: JSON.stringify(
      {
        message,
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

const store = async event => {
  let {user, location} = JSON.parse(event.body)
  const timestamp = new Date().getTime();
  let message, statusCode;

  try{
    await geoTableManager.putPoint({
      RangeKeyValue: { S: user.email }, // Use this to ensure uniqueness of the hash/range pairs.
      GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
          latitude: location.latitude,
          longitude: location.longitude
      },
      PutItemInput: { // Passed through to the underlying DynamoDB.putItem request. TableName is filled in for you.
          Item: { // The primary key, geohash and geojson data is filled in for you
            id: { S: uuid.v1()},
            user: { S: JSON.stringify(user)},
            location: { S: JSON.stringify(location) },
          },
      }
    }).promise()
    statusCode = 200
    message = 'Successfully created entry'
  }
  catch(err){
    statusCode = 500
    message = `Error creating entry: ${err.message}`
  }

  return {
    statusCode,
    body: JSON.stringify(
      {
        message,
        input: event,
      })
  }
};

module.exports = {hello, within, store}
