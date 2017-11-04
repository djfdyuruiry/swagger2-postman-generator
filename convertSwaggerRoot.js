var fs = require("fs")
var request = require("sync-request")

function convertSwaggerJson (swaggerJson, convertSwagger, options) {
    console.log(`Parsing Swagger JSON...`);

    var swaggerSpec = JSON.parse(swaggerJson);
    return convertSwagger(swaggerSpec, options);
}

function convertSwaggerRoot (convertSwagger = () => {}) {
    return { 
        fromUrl: (url, options) => {
            console.log(`Reading Swagger JSON from URL: ${url}...`);

            var response = request("GET", url);
            var swaggerJson = response.getBody();

            return convertSwaggerJson(swaggerJson, convertSwagger, options);
        },
        fromFile: (filePath, options) => {
            console.log(`Reading Swagger file from file: ${filePath}...`);

            var swaggerJson = fs.readFileSync(filePath);

            return convertSwaggerJson(swaggerJson, convertSwagger, options);
        },
        fromJson: (swaggerSpecJson, options) => convertSwaggerJson(swaggerJson, convertSwagger, options),
        fromSpec: (swaggerSpec, options) => convertSwagger(swaggerSpec, options)
    }
}

module.exports = convertSwaggerRoot;