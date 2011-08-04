# Changelog

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
