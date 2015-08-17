var mongodb = require('mongodb');
var Xray = require('x-ray');

var xray_scrapper = new Xray();

var dbUrl = 'mongodb://localhost:27017/fitnesspaldb';
var scrapedURL = 'http://www.myfitnesspal.com/food/calorie-chart-nutrition-facts';
var strSearchFoodLink = 'food/calories/';

//Traverse through the list of food items per tag
var getFoodItem = function(link){
	xray_scrapper(link, {
			brand: ['.brand'],
			foodName: ['.food_description a'],
			foodLink: ['.food_description a@href']
		})
	(function(err, fooditem){
		if(!err){
			var brandIndex = 0;
			var foodId;
				
			for(var i=0;i<fooditem.foodLink.length;i++){				
				//Use the detailed food webpage link's ID as the food ID to ensure that no duplicated pages are stored twice in the database
				foodId = checkFoodLink(fooditem.foodLink[i]);
				
				if(foodId > -1){
					getNutritionalValues(fooditem.foodLink[i],foodId,fooditem.foodName[i],fooditem.brand[brandIndex]);
					brandIndex++;
				}
			}
		}
		else{
			console.log('Retrying Link='+link);
			console.log(err);
			
			//Retry requesting the page if timeout
			if(err.code == 'ETIMEDOUT'){
				getFoodItem(link);
			}
		}
	});
};

//Check if link belongs to the detailed food page, or the brand
//Returns: Food ID (Assuming -1 is not a valid page)
var checkFoodLink = function(link){
	var checkIndex = link.indexOf(strSearchFoodLink);
	
	if(checkIndex == -1)
		return -1;
	else
		return link.substr(checkIndex + strSearchFoodLink.length, link.length);
};

//Traverse into the detailed food item to scrape the nutritional table values
var getNutritionalValues = function(link, foodId, foodName, foodBrand){
	xray_scrapper(link, {
			colIndex: ['#nutrition-facts td.col-1'],
			colValue: ['#nutrition-facts td.col-2'],
			classVal: ['#nutrition-facts td.col-1@class'],
		})
	(function(err, foodNutrients){
		if(!err){
			var nutrients = {};
			var foodItem = {};
			var totalFats = {};
			
			for(var i=0;i<foodNutrients.colIndex.length;i++){
				if(foodNutrients.colIndex[i].trim() != ''){
					//Store only the numeric values					
					if(foodNutrients.classVal[i] == 'col-1 sub'){
						//Store values under total fats
						totalFats[foodNutrients.colIndex[i].replace(' ','').toLowerCase()] = foodNutrients.colValue[i].replace(/[^0-9]/g,'');
					}
					else{
						nutrients[foodNutrients.colIndex[i].replace(' ','').toLowerCase()] = foodNutrients.colValue[i].replace(/[^0-9]/g,'');
					}
				}
			}
			
			foodNutrients = null;
			
			//Insert into database
			foodItem['_id'] = foodId;
			foodItem['foodname'] = foodName;			
			
			//Store company name/brand only if it is valid
			if(foodBrand != 'Generic')
				foodItem['brand'] = foodBrand;
				
			nutrients['typeoffats'] = totalFats;
			foodItem['nutrients'] = nutrients;
			
			//For debug only
			//console.log(foodItem);
			insertIntoDB(foodItem);			
			
			nutrients = null;
			foodItem = null;
			totalFats = null;		
		}
		else
		{
			console.log('Retrying Food ID='+foodId);
			console.log(err);
			
			//Retry requesting the page if timeout
			if(err.code == 'ETIMEDOUT'){
				getNutritionalValues(link, foodId, foodName, foodBrand);
			}
		}
	});
};

//Insert food items into MongoDB Food Collections
var insertIntoDB = function(foodDoc){
	var mongoClient = mongodb.MongoClient;
	
	//Connect to database
	mongoClient.connect(dbUrl, function(err, db){
		if(err){
			console.log('Unable to connect to database.');
		}
		else{
			//Connected to database
			var foodcollection = db.collection('foodcollections');
			
			//Insert into database (Update is used instead so that duplicate checking is passed down to MongoDB)
			foodcollection.update({'_id':foodDoc['_id']},foodDoc,{upsert:true}, function(err,result){
				if(err){
					console.log(err);
				}
				else{
					console.log('Insert new food item into foodcollections. Food ID = ',foodDoc['_id']);
				}
				
				//Close connection
				db.close();
			});
		}
	});
};

//Main Method starts here
xray_scrapper(scrapedURL, '#popular_tags', ['a@href'])(function(err, result){
	var curLink;
	console.log(result.length);
	
	//Start to scrape from the popular tag area
	for(var myKey = 0; myKey < result.length; myKey++)
	{
		curLink = result[myKey];
		
		console.log(myKey+': '+curLink);
		
		getFoodItem(curLink);
	}
});

console.log('For Holmusk!');