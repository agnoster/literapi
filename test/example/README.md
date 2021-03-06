# Example Tasks API

This is an example of how to use LiterAPI to document and test your server. Here we have an example server that serves up a simple webservice that represents a task list.

## List tasks

You can get a list of tasks quite simply:

    GET /tasks/

Initially, the database may be empty.

    200 OK
    Content-Type: application/json; charset=utf-8

    []

## Create a new task

In order to track our tasks, we're going to create a new task, which works as follows:

    POST /tasks/
    Content-Type: application/json; charset=utf-8

    { "name": "Take out the garbage" }

The response will return the newly-created task, with the default parameter `done` set to false if not otherwise specified.

    201 Created
    Content-Type: application/json; charset=utf-8

    { "id": [ITEM_ID], "name": "Take out the garbage", "done": false }

### Tasks require a name

If we try to create a task without a name:

    POST /tasks/
    Content-Type: application/json; charset=utf-8

    { "done": true }

This cannot be allowed, so the system returns an error:

    422 Unprocessable Entity
    Content-Type: application/json; charset=utf-8

    { "message": "Task must contain a name" }

## Retrieve a previously created task

    GET /tasks/[ITEM_ID]

### Response

    200 OK
    Content-Type: application/json; charset=utf-8

    { "id": [ITEM_ID], "name": "Take out the garbage", "done": false }

## Update a task

    PUT /tasks/[ITEM_ID]
    Content-Type: application/json; charset=utf-8

    { "id": [ITEM_ID], "name": "Take out the garbage today", "done": true }

### Response

    200 OK
    Content-Type: application/json; charset=utf-8

    { "id": [ITEM_ID], "name": "Take out the garbage today", "done": true }

## List updated tasks

    GET /tasks/

### Response

    200 OK
    Content-Type: application/json; charset=utf-8

    [ { "id": [ITEM_ID], "name": "Take out the garbage today", "done": true } ]

## Delete a task

    DELETE /tasks/[ITEM_ID]

### Response

    204 No Content

## Try to get a nonexistent task

    GET /tasks/[ITEM_ID]

### Response

    404 Not Found
    Content-Type: application/json; charset=utf-8

    { "error": * }

## Empty list after deletion

    GET /tasks/

### Response

    200 OK
    Content-Type: application/json; charset=utf-8

    []

## Using the same variable twice

    POST /tasks/
    Content-type: application/json; charset=utf-8

    { "name": "Test thing", "dummy1": [ITEM_ID], "dummy2": [ITEM_ID] }

    201 Created

    { "name": "Test thing", "dummy1": [ITEM_ID], "dummy2": [ITEM_ID], "id": [ITEM_TWO], ... }

## Capturing deeply-nested structures

    GET /tasks/[ITEM_TWO]

    200 OK

    [ITEM_TWO_DATA]

    GET /tasks/[ITEM_TWO]

    200 OK

    [ITEM_TWO_DATA]
