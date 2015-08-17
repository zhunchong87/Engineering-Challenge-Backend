var mongodb = require('mongodb');

var dbUrl = 'mongodb://localhost:27017/fitnesspaldb';

var mongoClient = mongodb.MongoClient;
	
//Connect to database
mongoClient.connect(dbUrl, function(err, db){
	if(err){
		console.log('Unable to connect to database.');
	}
	else{
		console.log('Connected to database :',dbUrl);
		
		var foodcollection = db.collection('foodcollections');

		//Create text index
		foodcollection.createIndex({foodname:'text',brand:'text'},function(err,result){
			if(err){
				console.log(err);
			}
			else{
				console.log('Building index ',result);
			}
			
			db.close();
		});
	}
});