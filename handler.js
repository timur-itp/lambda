'use strict';

const { parseJson } = require('@angular/cli/utilities/json-file');
const axios = require('axios');
// const API_KEY = "869d829f3fb82b5f7285043030d6225a";

  async function mySecrets(secretName) {
    var AWS = require('aws-sdk'),
    region = "eu-west-1",
    secretName = "arn:aws:secretsmanager:eu-west-1:551065951406:secret:MyFirstSecret-HsI5dr",
    secret,
    decodedBinarySecret;

    var client = new AWS.SecretsManager({
      region: region
  });

    return new Promise((resolve,reject)=>{
        client.getSecretValue({SecretId: secretName}, function(err, data) {
            if (err) {
                reject(err);
            }
            else {
                if ('SecretString' in data) {
                    resolve(parseJson(data.SecretString));
                } else {
                    let buff = new Buffer(data.SecretBinary, 'base64');
                    resolve(buff.toString('ascii'));
                }
            }
        });
    });
}




module.exports.getCurrentWeather = async (event, context, callback) => {

  const city = event.queryStringParameters.city
  let weather;
  var apiKey = await mySecrets('mysecret')
   const endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey.api_key}`;

  const Redis = require("ioredis");
    let client = new Redis({
      host:"redis-cache.h1zrtb.ng.0001.euw1.cache.amazonaws.com",
      port: 6379,
      connectTimeout: 10000,
    });

    if(city){
      const cityCached = client.get(city)

      if(cityCached === city){
        weather = client.get(weather);
      } else {
        let data = await axios.get(endpoint);
        weather = data.data
        client.set(city,weather)
      }
    }

  if(weather){
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(weather),
    };
    return response
  }


}
