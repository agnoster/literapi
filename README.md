# LiterAPI

* master: [![build status](https://secure.travis-ci.org/agnoster/literapi.png?branch=master)](http://travis-ci.org/agnoster/literapi)
* release: [![build status](https://secure.travis-ci.org/agnoster/literapi.png?branch=release)](http://travis-ci.org/agnoster/literapi)

LiterAPI is a tool for defining, documenting, and testing an API by simply writing example API calls in a markdown document. It is currently intended only for testing APIs that return JSON, and are described in a Markdown file.

In essence, you write a couple examples in your doc/spec and - *BAM* - LiterAPI turns those into executable tests.

It uses [JSONExp][] for matching expected vs. actual JSON responses. See the [JSONExp Documentation][] for more detailed information on the special syntax features.

## Installation

    npm install -g literapi

Or, include it in your `package.json`

    { ...
      "devDependencies": {
        ...
        "literapi": "~0.0.10"
        }
      }

(If you don't have [npm], you really should.)

## Usage

    literapi [API root URI] [testfile1] [testfile2] ...

## Example

If you had the file `example.md`:

    # Todo API

    ## Listing tasks

        GET /tasks/

    Returns an empty list:

        200 OK
        Content-Type: application/json

        []

Executing it like this:

    literapi http://api.example.com/v1/ example.md

Would give the output:

    GET /tasks/
    ✓ 200 OK
    ✓ content-type: application/json
    ✓ []
    
    ✓ OK » 3 honored (0.112s)

## Goals

* **Be readable** - LiterAPI should guide people to make specs that can be read easily by people unfamiliar with the project, so they quickly know how to use the API. Much like Markdown itself, a LiterAPI spec document should be readable without running it through anything else

* **Be fast** - Running tests isn't the funnest thing. Making it fast - which means running tests asynchronously - is the best way to make it fun to use

* **Be easy** - While of course documentation is essential, it should be easy to write LiterAPI specs without thinking too much about the syntax. To that end, it hews as close to standard HTTP and other conventions from programming as possible.

## Format

The format is simple: You write a markdown file. Any code block that begins something like `VERB /path` will be considered a request, and any code block that begins with a 3-digit numeric code will be considered a response.

### Request format

A request looks like this:

    VERB /path/to/resource
    Request-Header: ...

    POST DATA GOES HERE

The HTTP request will be sent basically as-is, with the exception of `Host` and `Content-Length` headers, which will be calculated automatically.

### Response format

A response looks like this:

    CODE Status Message
    Required-Response-Header: ...

    { "data": "is all JSON-encoded" }

Acceptance criteria:

  * The CODE *must* match the CODE of the response
  * Any header defined *must* appear in the response, but additional headers *may* be returned. The order is free.
  * The data returned will be JSON-decoded and compared with the expected response. The objects must be identical. If no expected response data is given, the response body must be blank.

## Advanced Format

Sometimes, literally matching the response just isn't powerful enough. For this reason, there are some extra tools that LiterAPI gives you via [JSONExp][], a system for expressing JSON-matching patterns, inspired by Regular Expressions.

See the [JSONExp Documentation][] for a more detailed description of how these patterns are parsed and matched.

### Bindings

Any uppercase text enclosed in square brackets (such as `[USER_ID]` or `[AUTH_TOKEN]`) is considered a *binding*. Bindings can be thought of as similar to captures in a RegExp, or named values. Since LiterAPI is declarative, all instances of a binding must match. Here's an example:

    We post a new status update:

        POST /status/

        { "text": "Hello World" }

    It gets a new ID assigned by the server:

        201 Created

        { "id": [STATUS_ID], "text": "Hello World" }

    Then, when we ask for the status by id

        GET /status/[STATUS_ID]

    We get it back:

        200 OK

        { "id": [STATUS_ID], "text": "Hello World" }

In this example, the `[STATUS_ID]` will get set in the first server response, by simply matching whatever it sees there. This could be an integer, a string, or even an array or an object. From that moment on, the binding is *bound* - it cannot change for any reason. Thus, in the second test, if the `id` field of the response did not match what we got on creation, an error would be found.

Bindings may also be used in the path, and can be captured and inserted into headers:

    We sign in:

        POST /login

        { "email": "foobar@example.com", "password": "Fsy58qffAFt3498" }

    And get back an authentication token

        200 OK
        X-Auth-Token: [AUTH]

    Which we can pass back to the server

        GET /secret/resource
        X-Auth-Token: [AUTH]

    to get access to privileged content

        200 OK

        { "privacy": "top_secret", ... }

This last response brings us to our next topic: globs

### Globs

LiterAPI supports two kinds of globs: `*`, which matches any JSON value, and `...`, which matches any set of key-value pairs.

The `*` glob is useful if you care that a value is there, but not what it is. It can be thought of as a binding that does not capture any value. For example, you might write:

    GET /status/1

    200 OK

    { "id": 1, "text": "This entry was inserted previously", "created_at": * }

In this instance, the response value would be required to have an `id` of 1, a `text` of "This entry was inserted previously", and a `created_at` field - however, the `created_at` field could be any value at all: a string, a number, a boolean, even an array or an object. If any of those fields were missing, we would get an error - but we would *also* get an error if any fields were returned that were not shown here.

The `...` glob is useful for just the case where we want to ensure certain fields are set, but there may be other fields we don't care to enumerate. Caution should, however, be exercised - part of the value of LiterAPI specs is that a reader can have a good impression of the full extent of the API, and thus, even if the testing of particular fields is not necessary, being strict will both ensure greater understandability of the markdown *and* additional protection from unforseen consequences if the API changes in any way.

Example usage:

    { "id": [USER_ID], "name": "Joe Schmoe", ... }

The `...` glob may also be used at the beginning or end of an array, such as:

    { "stream": ["first post!!!1", "second post", ...] }

## Contributing

LiterAPI is licensed under an MIT License. Contributions and bug reports are welcome, please use Github for those purposes.

### License

Copyright (C) 2012 by Isaac Wolkerstorfer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[npm]: http://npmjs.org/ "Node Package Manager"
[JSONExp]: https://github.com/agnoster/jsonexp
[JSONExp Documentation]: https://github.com/agnoster/jsonexp/wiki/Documentation
