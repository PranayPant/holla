'use strict';

const GeoPoint = require('geopoint')

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

const store = async event => {
  let {latitude, longitude, distance} = JSON.parse(event.body)
  let currPos = new GeoPoint( parseFloat(latitude), parseFloat(longitude))
  let bounds = currPos.boundingCoordinates( parseInt(distance) )
  let resStr = `{sw:[${bounds[0].latitude()}, ${bounds[0].longitude()}], ne:[${bounds[1].latitude()}, ${bounds[1].longitude()}]}`
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Stored params - resStr is ${resStr}`,
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports = {hello, store}
