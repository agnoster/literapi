var journey = require('journey')

var router = new journey.Router

function fakeDB(defaults) {
    var items = {}
      , _id = 0

    function init(item) {
        for (var k in defaults)
            if (defaults.hasOwnProperty(k) && !item.hasOwnProperty(k))
                item[k] = defaults[k]

        return item
    }

    this.insert = function (item) {
        return items[item.id = ++_id] = init(item)
    }

    this.remove = function (id) {
        delete(items[id])
    }

    this.get = function (id) {
        return items[id]
    }

    this.set = function (id, item) {
        if (id > _id) _id = id

        return items[item.id = id] = init(item)
    }

    this.list = function () {
        var results = []

        for (var key in items)
            if (items.hasOwnProperty(key))
                results.push(items[key])

        return results
    }
}

var tasks = new fakeDB({ done: false })

router.get('/tasks/').bind(function (req, res) {
    var list = tasks.list()
    res.send(200, {}, tasks.list())
})
router.get(/\/tasks\/(\w+)/).bind(function (req, res, id) {
    var task = tasks.get(id)
    if (task) res.send(tasks.get(id))
    else res.send(404, {}, { error: 'Could not find task "' + id + '"'})
})
router.post('/tasks/').bind(function (req, res, task) {
    res.send(201, {}, tasks.insert(task))
})
router.put(/\/tasks\/(\w+)/).bind(function (req, res, id, task) {
    res.send(tasks.set(id, task))
})
router.del(/\/tasks\/(\w+)/).bind(function (req, res, id) {
    tasks.remove(id)
    res.send(204)
})

var server = require('http').createServer(function (request, response) {
    var body = "";

    request.addListener('data', function (chunk) { body += chunk });
    request.addListener('end', function () {
        //
        // Dispatch the request to the router
        //
        router.handle(request, body, function (result) {
            response.writeHead(result.status, result.headers);
            response.end(result.body);
        });
    });
})

module.exports = server

