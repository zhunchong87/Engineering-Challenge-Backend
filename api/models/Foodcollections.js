/**
* Foodcollections.js
*
* @description :: This is the food collection model. Only allow creation of data attributes that falls within the MongoDB collection schema.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  schema: true,
  autoCreatedAt: false,
  autoUpdatedAt: false,
  tableName: 'foodcollections',
  attributes: {
    _id:{type:'string',columnName: '_id'},
    foodname:{type:'string',columnName: 'foodname',required: true},
    brand:{type:'string',columnName: 'brand'},
    nutrients:{type:'object',columnName: 'nutrients'}
  }
};