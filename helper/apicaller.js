// Copyright (c) 2019-2022 The Rollin.Games developers
// All Rights Reserved.
// NOTICE: All information contained herein is, and remains
// the property of Rollin.Games and its suppliers,
// if any. The intellectual and technical concepts contained
// herein are proprietary to Rollin.Games
// Dissemination of this information or reproduction of this materia
// is strictly forbidden unless prior written permission is obtained
// from Rollin.Games.

const https = require('https');
const crypto = require('crypto');
const rs = require('./randstr');
const cfg = require('../models/config');
const apicode = require('../models/apicode');

function buildChecksum(params, secret, t, r, postData) {
  const p = params || [];
  p.push(`t=${t}`, `r=${r}`);
  if (!!postData) {
    if (typeof postData === 'string') {
      p.push(postData);
    } else {
      p.push(JSON.stringify(postData));
    }
  }
  p.sort();
  p.push(`secret=${secret}`);
  return crypto.createHash('sha256').update(p.join('&')).digest('hex');
}

function tryParseJSON(s) {
  try {
    const o = JSON.parse(s);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {}
  return s;
}

function doRequest(url, options, postData) {
  console.log('request -> ', url, ', options ->', options);
  return new Promise((resolve, reject) => {
    let req = https.request(url, options, (res) => {
      let resData = [];
      res.on('data', (fragments) => {
        resData.push(fragments);
      });
      res.on('end', () => {
        let resBody = Buffer.concat(resData);
        resolve({ result: tryParseJSON(resBody.toString()), statusCode: res.statusCode });
      });
      res.on('error', (error) => {
        reject(error);
      });
    });
    req.on('error', (error) => {
      reject(error);
    });
    if (!!postData) {
      if (options.method === 'DELETE') {
        req.useChunkedEncodingByDefault = true;
      }
      req.write(postData);
    }
    req.end();
  });
}

module.exports.makeRequest = async function (targetID, method, api, params, postData) {
  if (targetID < 0 || method === '' || api === '') {
    return { error: 'invalid parameters' };
  }
  const r = rs.randomString(8);
  const t = Math.floor(Date.now()/1000);
  let url = `${cfg.api_server_url}${api}?t=${t}&r=${r}`;
  if (!!params) {
    url += `&${params.join('&')}`;
  }
  const apiCodeObj = await apicode.getAPICode(targetID).catch(() => {
  });
  if (!apiCodeObj) {
    console.log(`unable to find api code/secret of wallet_id ${walletID}`);
    return { error: `unable to find api code/secret of wallet_id ${walletID}` };
  }
  const options = {
    method,
    headers: {
      'X-API-CODE': apiCodeObj.code,
      'X-CHECKSUM': buildChecksum(params, apiCodeObj.secret, t, r, postData),
      "User-Agent": "nodejs",
    },
  };

  if (method === 'POST' || method === 'DELETE') {
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    let result = await doRequest(url, options, postData);
    const resp = tryParseJSON(result);
    console.log('response ->', resp ? JSON.stringify(resp) : '');
    return resp;
  } catch(error) {
    const resp = tryParseJSON(error);
    console.log('response ->', resp ? JSON.stringify(resp) : '');
    return resp;
  }
}
