# Example API doc

## List tasks

    GET /tasks/

### Response

    200 OK
    Content-Type: application/json
    
    []

## Create a new task

    POST /tasks/
    Content-Type: application/json

    { "name": "Take out the garbage" }

### Response

    201 Created
    Content-Type: application/json

    { "id": 1, "name": "Take out the garbage", "done": false }

## Retrieve a previously created task

    GET /tasks/1

### Response

    200 OK
    Content-Type: application/json

    { "id": 1, "name": "Take out the garbage", "done": false }

## Update a task

    PUT /tasks/1
    Content-Type: application/json

    { "id": 1, "name": "Take out the garbage today", "done": true }

### Response

    200 OK
    Content-Type: application/json

    { "id": 1, "name": "Take out the garbage today", "done": true }

## List updated tasks

    GET /tasks/
    
### Response

    200 OK
    Content-Type: application/json

    [
    { "id": 1, "name": "Take out the garbage today", "done": true }
    ]

## Delete a task

    DELETE /tasks/1

### Response

    204 No Content

## Try to get a nonexistent task

    GET /tasks/1

### Response

    404 Not Found
    Content-Type: application/json

    { "error": "Could not find task \"1\"" }

## Empty list after deletion

    GET /tasks/

### Response

    200 OK
    Content-Type: application/json

    []
