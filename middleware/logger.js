require('colors')

let select = {
    GET: 'green',
    POST: 'yellow',
    PUT: 'blue',
    PATCH: 'magenta',
    DELETE: 'red'
}

module.exports = function logger(req, res, next) {
    console.log(`${req.method}`[select[req.method]],  `${req.url}`.brightWhite);
    next()
}