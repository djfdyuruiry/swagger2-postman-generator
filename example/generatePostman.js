var Swagger2Postman = require("../swagger2-postman-generator");

var url = "http://generator.swagger.io/api/swagger.json"

var s2p = Swagger2Postman
    .convertSwagger()
    .fromUrl(url);

s2p.toPostmanCollectionFile("postman_collection_out.json", {prettyPrint: true});
s2p.toPostmanEnvironmentFile("postman_environment_out.json", {prettyPrint: true})
