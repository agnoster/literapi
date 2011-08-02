# WunderAPI

WunderAPI is a tool for defining, documenting, and testing an API by simply writing example API calls in a markdown document. It is currently intended only for testing APIs that return JSON, and are described in a Markdown file.

## Usage

    wunderapi [API root URI] [testfile1] [testfile2] ...

## Example

If you had the file `example.md`:

    # Todo API

    ## Listing tasks

    ### Request

        GET /tasks/

    ### Response

        200 OK

        []

Executing it like this:

    wunderapi http://api.example.com/v1/ example.md

Would give the output:

    Todo API
    ✓ Listing tasks
    
    ✓ OK » 1 honored (0.112s)

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

## License



