// Copyright (c) 2019-2022 The Rollin.Games developers
// All Rights Reserved.
// NOTICE: All information contained herein is, and remains
// the property of Rollin.Games and its suppliers,
// if any. The intellectual and technical concepts contained
// herein are proprietary to Rollin.Games
// Dissemination of this information or reproduction of this materia
// is strictly forbidden unless prior written permission is obtained
// from Rollin.Games.

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'wallet-api-mock-server' });
});

module.exports = router;
