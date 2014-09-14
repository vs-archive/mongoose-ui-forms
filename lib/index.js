'use strict';

var _ = require('lodash');

var utils = require('./utils');

module.exports = function (schema) {
  var _schema = utils.getPaths(schema, {});

  function toUiFormsSchema(){
    return _schema;
  }

  function getUiFormsProjection(){
    return _.pluck(_schema, 'field').join(' ');
  }

  schema.statics.getUiFormsProjection = getUiFormsProjection;
  schema.statics.getUiFormsSchema = toUiFormsSchema;
  schema._uiGridProjection = toUiFormsSchema();
};