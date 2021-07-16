const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//html get method for /orders
function list(req,res) {
    res.json( {data: orders});
}

//middleware for checking delieverTo property
function bodyHasDeliverTo (req,res,next){
    const { data : {deliverTo} = {}} = req.body;
    if(deliverTo && deliverTo != ""){
        return next();
    }
    next({
        status: 400,
        message: "Order must include a deliverTo",
    });
}

//middleware for checking mobileNumber property
function bodyHasMobileNumber (req,res,next) {
    const { data: {mobileNumber} = {} } = req.body;
    if (mobileNumber && mobileNumber != ""){
        return next();
    }
    next({
        status: 400,
        message: "Order must include a mobileNumber"
    })
}

//middleware for checking dishes property
function bodyHasDishes (req,res,next) {
    const { data: {dishes} = {} } = req.body;
    if(dishes && dishes.length >0) {
        return next();
    }
    next({
        status: 400,
        message: "Order must include at least one dish"
    })
}

//middleware to check if dishes property is an array
function dishesIsArray(req,res,next){
    const { data: {dishes} = {} } = req.body;
    if(Array.isArray(dishes)){
        return next();
    }
    next({
        status: 400,
        message: "Order must include a dish"
    })
}

//middleware to check for dish quantity
function dishHasQuantity(req,res,next){
    const { data: {dishes} = {} } = req.body;
    const missingProperty = dishes.find((dish) => (
        !dish.quantity || !Number.isInteger(dish.quantity)))

    if(missingProperty) {
        const index = dishes.indexOf(missingProperty);
        next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        })
    }
    return next();   
}

//html post method for /orders
function create(req,res){
    const { data = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: data.deliverTo,
        mobileNumber: data.mobileNumber,
        status: data.status,
        dishes: data.dishes
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder});
}
//middleware for checking existing orders
function orderExists(req,res,next) {
    const {orderId} = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder){
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exists: ${orderId}.`
    })
    console.log(foundOrder)
}

//http get method for /orders/:orderId
function read(req,res) {
    res.json({ data: res.locals.order });
}

//middleware for matching Order Id
function orderIdMatch(req,res,next) {
    const {orderId} = req.params;
    const { data: {id} = {} } = req.body;
    if (orderId === id || !id ) {
        return next();
    }
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    });
}

//middleware for checking status property
function bodyHasStatus (req,res,next) {
    const { data: {status} = {} } = req.body;
    if (
        status === "pending" || 
        status === " preparing" || 
        status === "out-for-delivery"
       ) {
        return next();
    }
    else if (status === "delivered") {
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

//html put method for /orders/orderId
function update(req,res){
    const order = res.locals.order;
    const { data = {} } = req.body;

    res.json({ data: {...order, ...data, id: order.id}})
}

//middleware to check if order is pending
function orderIsPending(req,res,next){
    const {status} = res.locals.order;
    if (status === "pending"){
        return next();
    }
    next({
        status: 400,
        message: "An order cannot be deleted unless it is pending"
    })
}
//html delete method for /orders/orderId
function destroy(req,res){
    const index = orders.indexOf(res.locals.order) //updated to use res.locals
    const deletedOrders = orders.splice(index,1);

    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        bodyHasDeliverTo,
        bodyHasMobileNumber,
        bodyHasDishes,
        dishesIsArray,
        dishHasQuantity,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        bodyHasDeliverTo,
        bodyHasMobileNumber,
        bodyHasDishes,
        dishesIsArray,
        dishHasQuantity,
        orderIdMatch,
        bodyHasStatus,
        update
    ],
    delete: [
        orderExists,
        orderIsPending,
        destroy
    ]
}