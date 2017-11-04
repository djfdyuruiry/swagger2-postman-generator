# swagger2-postman-generator #

A simple interface for coverting Swagger v2 JSON Specs to a Postman Collection, with any declared Swagger request bodies added as JSON to request bodies.

Based on the [swagger2-to-postman](https://github.com/postmanlabs/swagger2-to-postman) NPM package and [Swagger UI](https://github.com/swagger-api/swagger-ui) JSON example request generator.

Features:

- Import Swagger Spec direct from URL, JSON file, raw JSON string and JavaScript object 
- Export Postman Collection to JavaScript object, raw JSON, JSON file or via a HTTP POST
- Base URLs for endpoints are made generic with Postman environmnent placeholders for scheme (HTTP/HTTPS), host (some.website.com) and port (8080), a template Postman environment is available in ```postman_environment.json``` - http://some.website.com/api/do/stuff becomes {{scheme}}://{{host}}:{{port}}/api/do/stuff

NPM Package: https://www.npmjs.com/package/swagger2-postman-generator

---

## Install ##

``` shell
npm install swagger2-postman-generator
```

---

## Usage ##

This NPM module returns a single object which is used to access a chain of different import and generate functions. Import the module like so:

``` javascript
var Swagger2Postman = require("swagger2-postman-generator");

Swagger2Postman
    .convertSwagger()
    // do more stuff...
```

### Importing Swagger ###

This can then be followed by an import function

**Import Swagger URL**

``` javascript
Swagger2Postman
    .convertSwagger()
    .fromUrl("http://petstore.swagger.io/v2/swagger.json")
```

**Import Swagger JSON File**

``` javascript
Swagger2Postman
    .convertSwagger()
    .fromFile("swagger.json")
```

**Import Swagger JSON String**

``` javascript
Swagger2Postman
    .convertSwagger()
    .fromJson('{"swagger":"2.0",...')
```

**Import Swagger JavaScript Object**

``` javascript
var swaggerSpec = getSwaggerSpecFromSomewhere(); // example

Swagger2Postman
    .convertSwagger()
    .fromSpec(swaggerSpec)
```

### Exporting Postman ###

Once you have imported a Swagger spec, you have several options for generating the Postman collection output.


**Export to Postman JSON**

``` javascript
var collectionJson = Swagger2Postman
    .convertSwagger()
    .fromUrl("http://petstore.swagger.io/v2/swagger.json")
    .toPostmanCollectionJson()
```

**Export to Postman JSON File**

``` javascript
Swagger2Postman
    .convertSwagger()
    .fromFile("swagger.json")
    .toPostmanCollectionFile()
```

**Export to Postman JavaScript object**

``` javascript
var collection = Swagger2Postman
    .convertSwagger()
    .fromJson('{"swagger":"2.0",...')
    .toPostmanCollection()
```

**Export Postman via HTTP POST**

``` javascript
var swaggerSpec = getSwaggerSpecFromSomewhere(); // example

Swagger2Postman
    .convertSwagger()
    .fromSpec(swaggerSpec)
    .toPostmanCollectionPost("http://localhost/addCollection")
```

## Options ##


You can pass an options object to the ```from``` and ```to``` functions as the last parameter. No specific options are supported yet for ```from``` functions. 

Note when dealing with a Postman request body, URL or headers you can use the environment varible syntax to add placeholders; e.g. ```token: {{tokenVariable}}```

**```to``` function options**

- ```requestPreProcessor```: function that recieves the postman request and swagger spec, called before request URL and body are processed
- ```globalHeaders```: array of literal HTTP headers to add to all requests (useful for authentication headers etc.) e.g. ```Authorization: Basic {{base64Credentials}}```
- ```requestPostProcessor```: function that recieves the postman request and swagger spec, called after request URL and body are processed
- ```postJsonBuilder```: a function that recieves the postman collection as JSON and returns a custom JSON string to use as the POST body (only for ```toPostmanCollectionPost```)
- ```prettyPrint```: boolean which when set to true will pretty print Postman JSON output (does not apply to ```toPostmanCollection```)