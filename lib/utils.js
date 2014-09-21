'use strict';
var _ = require('lodash');

var ObjectId = require('mongoose').Schema.Types.ObjectId;

function UiFormOptions(opts) {
  var options = _.cloneDeep(opts);
  // todo: add support of html 5 input types
  //email//tel//number//search//range//url//color//date//datetime//time//month//week
  // todo: check enum
  // todo: check email
  if (options.type === String){
    // todo: use options.uiForm.type
    // todo: check default type for String
    options.type = 'text' || 'textarea';
  }

  if (options.type === Number){
    // todo: use options.uiForm.type
    // todo: check default type for Number
    options.type = 'number';
  }

  if (options.type === Boolean){
    // todo: use options.uiForm.type
    // todo: check default type for Boolean
    options.type = 'checkbox';
  }

  if (options.type === Date){
    // todo: use options.uiForm.type
    // todo: check default type for Date
    options.type = 'date';
  }

  // this is direct reference type
  if (options.type === ObjectId && options.field !== '_id'){
    // todo: use options.uiForm.type
    // todo: check default type for ObjectId||ref field
    options.type = 'select' || 'typeahead';
  }

  // _id - field
  if (options.type === ObjectId && !options.ref){
    options.type = 'text';
    options.editable = false;
    options.visible = false;
  }

  // array of refs
  if (Array.isArray(options.type) && options.type[0] && !!options.type[0].ref){
    options.type = 'arrayRef';
  }

  // array
  if (Array.isArray(options.type)){
    options.type = 'array';
    options.hideLabels = true;
  }

  if (options.uiForm && options.uiForm.type){
    options.type = options.uiForm.type;
  }

  if (options.ref && !options.uiForm){
    console.warn('add uiForm to path: %s', options.ref);
  }


  if (this.auto === true){
    this.visible = this.visible || false;
    delete this.auto;
  }

  options.visible = (options.visible === false) ? false : true;
  _.merge(this, options, options.uiForm);
}

function MongooseUtils() {
}

function toUiGridColumnDef(paths, parent) {
  if (parent && !Array.isArray(parent)) {
    parent = [parent];
  }

  var mix = _.map(paths, function (uiFormOptions, path) {
    if (uiFormOptions instanceof UiFormOptions) {
//      if (uiFormOptions.ref){
//        uiFormOptions.field = [path, uiFormOptions.field].join('.')
//        return uiFormOptions;
//      }

      if (parent && parent.length) {
        return _.merge(uiFormOptions, {field: [parent.join('.'), path].join('.')});
      }

      return _.merge(uiFormOptions, {field: path});
    }

    return toUiGridColumnDef(uiFormOptions, path);
  });

  if (parent) {
    return mix;
  }

  return _.flatten(mix);
}

/**
 * Returns an array with ui grid column options
 * @param schema - mongoose schema for collection
 * @param options - call options
 * @returns {*}
 */
MongooseUtils.prototype.getPaths = function getPaths(schema, options) {
  var self = this;
  var paths = _.reduce(schema.paths, function (result, pathSchema, path) {

    //// Nested schema OR Array can no be a column
    //if ((pathSchema.schema && self.include(pathSchema.schema)) ||
    //  ( Array.isArray(pathSchema.options.type) &&
    //  (!!pathSchema.options.type[0] && self.include({options: pathSchema.options.type[0]})))) {
    //  var msg = 'Nested schema or Array can not be a column in ui-grid! Path: ' + path;
    //  throw new Error(msg);
    //}

    var valIncl = self.include(pathSchema);

    // Array
    if (Array.isArray(pathSchema.options.type)){
      result[path] = valIncl;
      var array = null;

      // ignore mixed array {type: []} for now: !pathSchema.options.type[0]
      if (!array && !pathSchema.options.type[0]){
        array = [];
      }

      // Array of ref
      if (!array && pathSchema.options.type[0].ref){
        array = [new UiFormOptions(pathSchema.options.type[0])];
      }

      result[path].array = array || self.getPaths(pathSchema.options.type[0]);
    }

    if (!result[path] && valIncl) {
      result[path] = valIncl;
    }

    return result;
  }, {});
  var _paths = toUiGridColumnDef(paths);
  return _paths;
};

/**
 * Returns true for private fields
 * @param pathSchema - mongoose schema for path
 * @param path - path name
 * @param options - call options
 * @returns {Object}
 */
MongooseUtils.prototype.include = function include(pathSchema) {
  return new UiFormOptions(pathSchema.options);
  //return !!pathSchema.options.uiForm ? new UiFormOptions(pathSchema.options.uiGrid) : null;
};

module.exports = new MongooseUtils();