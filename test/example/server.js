var express = require('express')
  , http = require('http')

var router = express()
router.use(express.bodyParser())

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

router.get('/tasks/', function (req, res) {
    var list = tasks.list()
    res.json(200, tasks.list())
})
router.get(/\/tasks\/(.+)/, function (req, res) {
    var id = req.params[0]
    var task = tasks.get(id)
    if (task) res.json(200, tasks.get(id))
    else res.json(404, { error: 'Could not find task "' + id + '"'})
})
router.post('/tasks/', function (req, res) {
    var task = req.body
    if (!task.name) return res.json(422, { message: "Task must contain a name" })
    return res.json(201, tasks.insert(task))
})
router.put(/\/tasks\/(\w+)/, function (req, res) {
    var id = req.params[0]
    var task = req.body
    res.json(200, tasks.set(id, task))
})
router.del(/\/tasks\/(\w+)/, function (req, res) {
    var id = req.params[0]
    tasks.remove(id)
    res.send(204)
})

module.exports = http.createServer(router)
