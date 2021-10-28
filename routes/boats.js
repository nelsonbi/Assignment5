const router = require('express').Router();
const ds = require('../datastore');
const { appendSelf, getKey } = require('./helperfxn');

const datastore = ds.datastore;


const BOATS = "Boats";

/* ------------- Begin Lodging Model Functions -> Boats ------------- */
// create a new boat
function post_boat(name, type, length, type) {
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
function get_boat(id) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        //console.log(entity);
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

// edit part of a boat
function patch_boat(id, data) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        console.log(entity);
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            console.log("we are iffing " + entity);
            return entity[0];
        } else {
            const patch_boat = { "name": data.name, "type": data.type, "length": data.length };
            return datastore.update({ "key": key, "data": patch_boat }).then(() => { 
            patch_boat.id = key.id
            console.log(patch_boat)
            return patch_boat 
            });             
        };
    });
};

function put_boat(id, name, type, length) {
    const key = datastore.key([BOATS, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
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
router.post('/', function (req, res) {
    console.log("posting the boats")     
    if (req.body.name == null || req.body.type == null || req.body.length == null){
        res.status(400).send('{"Error": "The request object is missing at least one of the required attributes"}')
    }
    else{
        post_boat(req.body.name, req.body.type, req.body.length)
            .then(key => {
                //var findURL = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                //console.log(findURL);
                //append self and complete URL
                key.self = req.protocol + '://' + req.get('host') + req.originalUrl + '/' + key.id;
                console.log(key);
                res.status(201).send(key) });
}});

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
router.get('/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                boat = boat[0];
                boat.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                res.status(200).json(boat);
            }
        });
});

// edit a few parts of the boat
router.patch('/:id', function (req, res) {
    console.log("patching the boats")     
    if (req.body.name == null || req.body.type == null || req.body.length == null){
        res.status(400).send('{"Error": "The request object is missing at least one of the required attributes"}')
    }
    else{
        patch_boat(req.params.id, req.body)
            .then(boat => {
                console.log(boat)
                if (boat === undefined || boat === null) {
                    // The 0th element is undefined. This means there is no lodging with this id
                    res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
                } else {
                    boat.self = req.protocol + '://' + req.get('host') + req.originalUrl;
                    res.status(200).json(boat);
                }
            });
}});

// edit entire contents of boat
router.put('/:id', function (req, res) {
    console.log("putting the boats")
    put_boat(req.params.id, req.body.name, req.body.type, req.body.length)
        .then(res.status(200).end());
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

/* ------------- End Controller Functions for Boats ------------- */

module.exports = router;
