/**
 * FoodcollectionsController
 *
 * @description :: Contain APIs here for managing foodcollections.
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
	//Find food API (Autocomplete)
	find: function(req,res){		
		var searchFoodName = req.param('name');
		
		//Use mongo text index search, sort by top 10 search results		
		Foodcollections.native(function(err,collection){
			if(err) 
				return res.serverError(err);
			
			//Text index: foodname, brand/company name 
			collection.find(
				{$text: {$search : searchFoodName}}, //Search field
				{score: {$meta: 'textScore'}, foodname: '1'} //Projection fields
			).sort({score: {$meta: 'textScore'}}).limit(10).toArray(function(err,result){
				//Remove scores before returning results
				for(var i=0; i<result.length; i++){
					delete result[i].score;
				}
				
				return res.json(result);
			});
		});
	},
	
	//Get food nutrients API
	getNutrients: function(req,res){		
		var foodId = req.param('id');
		
		//Get nutritional table values by food ID
		Foodcollections.findOne({id:foodId}).exec(function(err,record){
			if(err) 
				return res.serverError(err);
			
			if(record == null)
				return res.json({error:'No record found with this ID'});
			else
				return res.json(record.nutrients);
		});
	},
	
	//Create food item API
	create: function(req,res){
		Foodcollections.create(req.body).exec(function(err,created){
			if(err) 
				return res.serverError(err);
				
			return res.json(created);
		});
	}
};

