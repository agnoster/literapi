# Changelog

## 0.0.9

* Fix bug where only one pattern would get matched per key in request
* Added test for multiple occurrences of a capture in request and response

## 0.0.8

* Fix bug where [] and {} would incorrectly match null
* Fix bug where `-a` flag would crash
* Correct usage information
* Exit status 2 if any tests errored, 3 if there were both errors and broken test
* Major refactor to the JSON expression matching
    * JSONExp is now its own class, will later be split into own module
    * Variables will now be checked for identity even in the context in which they are declared
    * Substring variable replacement no longer supported

## 0.0.7

* Fix bug where empty content would cause nginx to choke
* Default output now shows only errors
* To show all cases, including success, use `-a` flag
* The `-p` flag for running suites in parallel is disabled to workaround Vows
* Exit status of the process reflects test status:
  * 0 (OK) if all tests passed
  * 1 (FAIL) if any are broken or errored
* Output now shows actual JSON response if there is a mismatch

## 0.0.6

* Improved README
* Fix bug where headers would all behave like the last header
* Handle empty bodies when detecting where the next request/response begins in markdown
* Run tests serially by default, add `-p` flag to run in parallel
* Add `-h` flag for help, also show usage if not enough parameters are given

## 0.0.5

* Major refactor to allow concurrent test runs (previously all runs would share a variable space)
* Added `-v` flag to get version number

## 0.0.4

* Requests and responses can now be interleaved without explicitly ending the blocks
* Fixed bug where using the root path (like "GET /") wouldn't work
* Capture an error for non-JSON data
* Fixed bug where missing fields would not cause failure
* Changed glob syntax:
    * `*` is for matching any value
    * `...` is for matching any additional keys in an object
* Expected responses that do not parse as JSON are checked for literal string match with the actual response

## 0.0.3

* Added capture pattern '...', matches anything
* Fixed a bug where multiple captures wouldn't be matched

## 0.0.2

* Command-line tool `wunderapi` is provided
* Added variable capture and substitution
* Compile [vows] directly, without eval()

## 0.0.1

* Markdown parsing
* Generate and run [vows] tests
* Basic testing with a sample [journey] app


[vows]:         http://vowsjs.org/
[journey]:      https://github.com/cloudhead/journey
