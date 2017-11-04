var Swagger2Postman = require("../swagger2-postman-generator.js");

var url = "http://petstore.swagger.io/v2/swagger.json"

Swagger2Postman
    .convertSwagger()
    .fromUrl(url)
    .toPostmanCollectionFile("petstore_postman_collection.json", {prettyPrint: true});
