'use strict';

var _ = require('lodash');

var utils = require('./utils');

// todo: TBD add options: isTabsVisible on default page
module.exports = function (schema) {
  var paths = utils.getPaths(schema, {});
  var _schema = utils.toUiFormsSchema(paths);
  var tabs = _(paths).map(function (p) {
    if (!p.tabName) {
      return false;
    }

    return {name: p.tabName, order: p.tabOrder};
  })
    .compact()
    .unique('name')
    .sortBy('order')
    .value();

  function toUiFormsSchema() {
    return _schema;
  }

  function getUiFormsProjection() {
    return _.pluck(_schema, 'field').join(' ');
  }

  Object.defineProperties(schema.statics, {
    UiFormsTabs: {value: tabs, enumerable: true},
    UiFormsSchema: {value: _schema, enumerable: true}
  });

  schema.statics.getUiFormsProjection = getUiFormsProjection;
  schema.statics.getUiFormsSchema = toUiFormsSchema;
};