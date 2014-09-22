'use strict';
var _ = require('lodash');

var ObjectId = require('mongoose').Schema.Types.ObjectId;

function UiFormOptions(opts) {
  var options = _.cloneDeep(opts);
  Object.defineProperty(options, '_type', { value:options.type});
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

  // _id - field
  if (options.type === ObjectId && !options.ref){
    options.type = 'text';
    options.editable = false;
    options.visible = false;
  }

  // this is direct reference type
  if (options.type === ObjectId && options.ref){
    // todo: use options.uiForm.type
    // todo: check default type for ObjectId||ref field
    options.type = 'select' || 'typeahead';
  }

  // array of refs
  if (Array.isArray(options.type) && options.type[0] && !!options.type[0].ref){
    options.ref = options.type[0].ref;
    options.type = 'arrayRef';
  }

  // array
  if (Array.isArray(options.type)){
    options.type = 'array';
    options.hideLabels = true;
  }

  if (options.ref && !options.uiForm){
    console.warn('add uiForm to path: %s', options.ref);
  }

  if (options.auto === true){
    options.visible = options.visible || false;
    delete options.auto;
  }

  _.merge(this, options, options.uiForm);

  if (this.tabName){
    this.visible = false;
  }

  if (this.visible !== false){
    this.visible = true;
  }
}

function MongooseUtils() {
}

MongooseUtils.prototype.toUiFormsSchema = function toUiFormsSchema(paths, parent) {
  if (parent && !Array.isArray(parent)) {
    parent = [parent];
  }

  var mix = _.map(paths, function (uiFormOptions, path) {
    if (uiFormOptions instanceof UiFormOptions) {
      // todo: could be errors
      if (uiFormOptions.array){
        uiFormOptions.array = toUiFormsSchema(uiFormOptions.array);
      }
      if (parent && parent.length) {
        return _.merge(uiFormOptions, {field: [parent.join('.'), path].join('.')});
      }

      return _.merge(uiFormOptions, {field: path});
    }

    return toUiFormsSchema(uiFormOptions, path);
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
  //flatten mixed type or ignore mixed type without fields
  //field: { type: {} }
  var _paths = _.reduce(schema.paths, function (result, schema, path){
    if (schema.constructor.name === 'Mixed'){
      if (!schema.options.type || Object.keys(schema.options.type).length === 0){
        return result;
      }
      // flatten
      flatten(result, schema.options.type, path, schema.options.uiForm);
      return result;
    }
    result[path] = schema;
    return result;
  }, {})

  function flatten(result, paths, parent, parentOptions){
    parent = parent || [];
    if (!Array.isArray(parent)){
      parent = [parent];
    }

    _.each(paths, function (schema, path){
      if (typeof schema === 'function' ){
        result[parent.concat(path).join('.')] = {options: _.extend({type: schema}, {uiForm: parentOptions})};
        return;
      }

      if (typeof schema.type === 'function'){
        result[parent.concat(path).join('.')] = {options: _.extend(schema, {uiForm: parentOptions})};
        return;

      }
      flatten(result, paths[path], parent.concat(path), _.extend({}, parentOptions, schema.options && schema.options.uiForm));
    });
  }

  var paths = _.reduce(_paths, function (result, pathSchema, path) {
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
      return result;
    }

    if (!result[path] && valIncl) {
      result[path] = valIncl;
    }

    return result;
  }, {});

  return paths;
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