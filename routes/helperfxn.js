const ds = require('../datastore');
const datastore = ds.datastore;
const Joi = require('joi');



function appendSelf(array, url){
    for (var i = 0; i < array.length; i++){
        array[i].self = url + array[i].id
    }
    return array;
}

function getKey(name, id){
    return datastore.key([name, parseInt(id, 10)]);
}

function contentType(req){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send({ERROR: 'Server only accepts application/json data.'})
    }
}


/*
    Validtion for boats
*/
const boatsValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().min(2).max(15),
        type: Joi.string().required(),
        length: Joi.number().required()
    });
    //const validate = schema.validate(req.body);
    return schema.validate(data);
};

module.exports.appendSelf = appendSelf;
module.exports.getKey = getKey;
module.exports.boatsValidation = boatsValidation;
module.exports.contentType = contentType;
