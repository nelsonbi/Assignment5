const router = require('express').Router();
const ds = require('../datastore');
const { appendSelf, boatsValidation, getKey} = require('./helperfxn');
const json2html = require('json-to-html');

const datastore = ds.datastore;


const BOATS = "Boats";


function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- Begin Lodging Model Functions -> Boats ------------- */
// create a new boat
function post_boat(name, type, length) {
    var key = datastore.key(BOATS);
    const new_boat = { "name": name, 
                        "type": type, 
                        "length": length
                    };
    return datastore.save({ "key": key, "data": new_boat }).then(() => { 
        new_boat.id = key.id
        return new_boat 
    });
}

// get all the boats
function get_boats() {
    const q = datastore.createQuery(BOATS);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

// get a single boat

// get a single boat
function get_boat(id) {
    const key = getKey(BOATS, id);
    //const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        //console.log(entity);
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(ds.fromDatastore);
        }
    });
}

// edit part of a boat
async function patch_boat(id, data) {
    const key = getKey(BOATS, id);
    let boat = await datastore.get(key);

    //checking for existing boat
    if (boat[0] === undefined || boat[0] === null) {
    // No entity found. Don't try to add the id attribute
    return boat[0];
    }

    const dataKeys = Object.keys(data);
    // data to be updated
    let updatedBoat = {"name": boat[0].name,
                        "type": boat[0].type,
                        "length": boat[0].length}
    console.log(updatedBoat);

    //checking for duplicate name
    if(dataKeys.find(element => element == "name")){
        console.log("...........................Found a name")
        const query = datastore.createQuery(BOATS).filter('name', '=', data.name);
        const results = await datastore.runQuery(query)
        if(results[0].length > 0){
           return "Duplicate Name" 
        } 
        else{
            updatedBoat.name = data.name;
        }
    }
    //updating lengths
    if(dataKeys.find(element => element == "length")){
        updatedBoat.length = data.length;
    }
    //updating type
    if(dataKeys.find(element => element == "type")){
        updatedBoat.type = data.type;
    }
    // sending to datastore
    return await datastore.update({"key": key, "data": updatedBoat });    
    }


async function put_boat(id, name, type, length) {
    const key = getKey(BOATS, id);
    let boat = await datastore.get(key);
    console.log(boat[0]);

    //checking for existing boat
    if (boat[0] === undefined || boat[0] === null) {
    // No entity found. Don't try to add the id attribute
    return boat[0];
    }else{
        const putBoat = { "name": name, "type": type, "length": length };
        return datastore.save({ "key": key, "data": putBoat });
    }
}

function delete_boat(id) {    
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            console.log("we are iffing " + entity);
            return entity[0];
        } else {
            return datastore.delete(key);          
        };
    });
}

/* ------------- End Model Functions -> Boats ------------- */

/* ------------- Begin Controller Functions for Boats ------------- */

// add a new boat
router.post('/', async function (req, res) {
    console.log("posting the boats") 

    // validate content type
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send({ERROR: 'Server only accepts application/json data.'})
        } else{
            // validating data
        const validate = boatsValidation(req.body);
        // sending back any validation error messages
        if(validate.error) return res.status(400).send({ERROR: validate.error.details[0].message});

        // ensure name of boat is unique
        const query = datastore.createQuery(BOATS).filter('name', '=', req.body.name);
        const results = await datastore.runQuery(query)
        if(results[0].length > 0) return res.status(403).send({ERROR : "Boat name is in use.  Please enter a different name"});

        // create the boat and return its data
        post_boat(req.body.name, req.body.type, req.body.length)
            .then(key => {
                key.self = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                //console.log(key);
                res.status(201).send(key) });
    }
});

// get all the boats
router.get('/', function (req, res) {
    console.log("getting the boats")
    const boats = get_boats()
        .then((boats) => {
            boats = appendSelf(boats, req.protocol + '://' + req.get('host') + req.originalUrl + '/');
            res.status(200).json(boats);
        });
});

// get a single boat
router.get('/:id', function(req, res){
    const boat = get_boat(req.params.id).then( (boat) => {        
        // checking for valid boat
        if (boat[0] === undefined || boat[0] === null) return res.status(404)
                        .json({ 'Error': 'No boat with this boat_id exists' });

        // checking for client content type
        const accepts = req.accepts(['application/json', 'text/html']);

        // if content type is not ['application/json', 'text/html']
        if(!accepts){
            res.status(406).send({Error: 'Not Acceptable'});
        
        // if content type is application/json
        } else if(accepts === 'application/json'){
            res.status(200).json(boat[0]);
        
        // if content type is text/html
        } else if(accepts === 'text/html'){
            res.status(200).send(json2html(boat[0]).slice(1,-1));

        // if nothing else worked
        } else { res.status(500).send({EROOR: 'Content type got messed up!'}); }
    });
});

// edit a few parts of the boat
router.patch('/:id', function (req, res) {
    console.log("patching the boats") 

    // if no properties were entered to update
    if (Object.keys(req.body).length == 0){
        res.status(400).send({ERROR: "Please enter properties you'd like to update"})
    }
    // if user is trying to update the ID property
    else if(req.body.id){
        res.status(400).send({ERROR: "Cannot update the ID property of the boat"})
    }
    // if the content type is not application/json
    else if(req.get('content-type') !== 'application/json'){
        res.status(415).send({ERROR: 'Server only accepts application/json data.'})
        } else{
        // make the update
        patch_boat(req.params.id, req.body)
            .then(boat => {
                if (boat === undefined || boat === null) {
                    // The 0th element is undefined. This means there is no lodging with this id
                    res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
                }else if(boat == "Duplicate Name"){
                    return res.status(403).send({ERROR : "Boat name is in use.  Please enter a different name"});
                
                } else {
                    res.status(200).end();
                }
            });
}});

router.put('/:id', async function (req, res) {
    console.log("putting the boats") 

    // validate content type
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send({ERROR: 'Server only accepts application/json data.'})
        } else{
            console.log("........................1")
            // validating data
            const validate = boatsValidation(req.body);
            // sending back any validation error messages
            if(validate.error) return res.status(400).send({ERROR: validate.error.details[0].message});
            console.log("........................2")
            // if user is trying to update ID property
            if(req.body.id) return res.status(400).send({ERROR: "Cannot update the ID property of the boat"})
            console.log("........................3")
            // ensure name of boat is unique
            const query = datastore.createQuery(BOATS).filter('name', '=', req.body.name);
            const results = await datastore.runQuery(query)
            console.log("........................4")
            if(results[0].length > 0) return res.status(403).send({ERROR : "Boat name is in use.  Please enter a different name"});
            console.log("........................5")
            // create the boat and return its data
            put_boat(req.params.id, req.body.name, req.body.type, req.body.length)
            .then(boat => {
                if (boat === undefined || boat === null) return res.status(404)
                        .json({ 'Error': 'No boat with this boat_id exists' });

                const location = req.protocol + '://' + req.get('host') + req.originalUrl
                res.setHeader('Location', location);
                res.status(303).send({Success: "See location header"});              
            })
    }
});

// delete the whole boat
router.delete('/:id', function (req, res) {
    delete_boat(req.params.id)
    .then(boat => {
        console.log(boat)
        if (boat === undefined || boat === null) {
            // The 0th element is undefined. This means there is no lodging with this id
            res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        } else {
            res.status(204).end();
        }
    });
});

router.delete('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end("Please provide the ID of the boat you'd like to delete");
});

router.put('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end("Please provide the ID of the boat you'd like to edit");
});

/* ------------- End Controller Functions for Boats ------------- */

module.exports = router;
