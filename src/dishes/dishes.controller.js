const { response } = require("express");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//http get method for /dishes
function list (req,res) {
    res.json({ data: dishes });
}

//middleware for checking name
function bodyHasName (req, res, next) {
    const { data : {name} = {}} = req.body;
    if(name && name != ""){
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a name",
    });
}

//middleware for checking description
function bodyHasDescription (req, res, next) {
    const { data : {description} = {}} = req.body;
    if(description && description != ""){
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a description",
    });
}

//middleware for checking price
function bodyHasPrice (req, res, next) {
    const { data : {price} = {}} = req.body;
    if(price && price > 0 && Number.isInteger(price)){
        return next();
    }
    next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0",
    });
}

//middleware for checking image_url
function bodyHasImageUrl (req, res, next) {
    const { data : {image_url} = {}} = req.body;
    if(image_url && image_url != ""){
        return next();
    }
    next({
        status: 400,
        message: "Dish must include an image_url",
    });
}

//http post method for /dishes
function create(req,res,next) {
    const { data = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.image_url
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish});
}

//middleware for checking existing dishes
function dishExists(req,res,next) {
    const {dishId} = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish){
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    })
}

//http get method for /dishes/:dishId
function read(req,res) {
    res.json({ data: res.locals.dish });
}

//middleware for matching Dish Id
function dishIdMatch(req,res,next) {
    const {dishId} = req.params;
    const { data: {id} = {} } = req.body;
    if (dishId === id || !id ) {
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`
    });
}

//http put method for /dishes/:dishId
function update (req,res){
    const dish = res.locals.dish;
    const { data = {} } = req.body;

    res.json({ data: {...dish, ...data, id: dish.id}}); //FINALLY figured out how the spread operator works!
}
module.exports = {
    list,
    create: [
        bodyHasName, 
        bodyHasDescription, 
        bodyHasPrice,
        bodyHasImageUrl, 
        create],
    read: [
        dishExists,
        read
    ],
    update: [
        dishExists,
        bodyHasName,
        bodyHasDescription,
        bodyHasPrice,
        bodyHasImageUrl,
        dishIdMatch,
        update
    ]
}