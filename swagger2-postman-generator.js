var fs = require("fs")
var request = require("sync-request")

var Swagger2Postman = require("swagger2-to-postman");
var Swagger2Object = require("swagger2-to-object"); 

const ignoredVariables = ["scheme", "host", "port"];
const environmentFile = "./postman_environment.json";

/* postman collection post-processing */
function populateRequestJsonIfDefined (postmanRequest, swaggerSpec, swaggerRefsLookup) {
    var url = postmanRequest.url;
    var basePath = swaggerSpec.basePath;

    var relativePath = url.replace(`{{scheme}}://{{host}}:{{port}}${basePath}`, "")
    var swaggerPath = ((relativePath.replace(/\/:([a-zA-Z0-9]+)/, "/{$1}")).split("?"))[0]

    var swaggerPathRoot = swaggerSpec.paths[swaggerPath];

    if (!swaggerPathRoot) {
        return;
    }

    var requestMethod = postmanRequest.method.toLowerCase();
    var swaggerPathDef = swaggerPathRoot[requestMethod]
    
    if (!swaggerPathDef) {
        return;
    }

    var sampleObj = Swagger2Object
        .generateObject()
        .for()
        .pathBodyUsingRefs(swaggerPathDef, swaggerRefsLookup);
    
    if (sampleObj) {
        postmanRequest.rawModeData = JSON.stringify(sampleObj, null, 4);
    }
}

function processPostmanCollection (postmanCollection, swaggerSpec, options) {
    var swaggerRefsLookup = Swagger2Object
        .buildRefsLookup()
        .forSpec(swaggerSpec);    

    postmanCollection.requests.forEach((request) => {
        if (options && options.requestPreProcessor && typeof options.requestPreProcessor === "function") {
            options.requestPreProcessor(request, swaggerSpec, swaggerRefsLookup);
        }
    
        request.url = request.url.replace(/[hH][tT][tT][pP][sS]{0,1}:\/\//,  "{{scheme}}://");
        request.url = request.url.replace(/:\/\/.+?\//,  "://{{host}}:{{port}}/");

        populateRequestJsonIfDefined(request, swaggerSpec, swaggerRefsLookup);

        if (!options) {
            return;
        }

        if (options.globalHeaders && options.globalHeaders.length > 0) {
            options.globalHeaders.forEach(function(header) {
                request.headers += `${header}\n`;
            }, this);
        }

        if (options.requestPostProcessor && typeof options.requestPostProcessor === "function") {
            options.requestPostProcessor(request, swaggerSpec, swaggerRefsLookup);
        }
    });
}

/* swagger to postman conversions */
function convertSwaggerSpecToPostmanCollection (swaggerSpec) {
    var converter = new Swagger2Postman(); 
    var convertResult = converter.convert(swaggerSpec);

    if (convertResult.status === "failed") {
        throw `postman conversion of swagger spec failed: ${JSON.stringify(convertResult)}`;
    }

    return convertResult.collection;
}

function convertSwaggerToPostman (swaggerSpec, options) {  
    var postmanCollection = convertSwaggerSpecToPostmanCollection(swaggerSpec, options);

    processPostmanCollection(postmanCollection, swaggerSpec, options);

    return postmanCollection;    
}

function convertSwaggerToPostmanJson (swaggerSpec, options) {
    var postmanCollection = convertSwaggerToPostman(swaggerSpec, options);

    if (options && options.prettyPrint) {
        return JSON.stringify(postmanCollection, null, 4);
    } else {
        return JSON.stringify(postmanCollection);
    }
}

/* swagger to postman environment conversions */
function buildEnvironmentVariable (name, value = "", type = "text", enabled = true) {
    return {
        key: name,
        value: value,
        type: type,
        enabled: enabled
    }
}

function convertSwaggerToPostmanEnvironment (swaggerSpec, options) {  
    var environmentJson = fs.readFileSync(environmentFile);
    var environment = JSON.parse(environmentJson);
    
    var postmanCollectionJson = convertSwaggerToPostmanJson(swaggerSpec, options);
    var uniqueVariables = [...new Set(postmanCollectionJson.match(/\{\{.+\}\}/g))];

    var uniqueVariableDictionary = {}

    if (options && options.name) {
        environment.name = `${name}`
    }

    uniqueVariables.forEach((v) => {
        if (v === "{{scheme}}://{{host}}:{{port}}") {
            return;
        }

        var sanitisedValue = v.replace(/[{}]/g, "");
        var environmentVariable = buildEnvironmentVariable(v, sanitisedValue);
        
        environment.values.push(environmentVariable)

        uniqueVariableDictionary[v] = true;
    });

    if (!options || !options.customVariables || options.customVariables.length < 1) {
        return environment;
    }

    options.customVariables.forEach((cv) => {
        var variableName = cv.name;

        if (uniqueVariableDictionary[variableName]) {
            return;
        }

        var environmentVariable = 
        buildEnvironmentVariable(variableName, cv.value, cv.type, cv.enabled);

        environment.values.push(environmentVariable);
    });

    return environment;
}

function convertSwaggerToPostmanEnvironmentJson (swaggerSpec, options) {
    var postmanEnvironment = convertSwaggerToPostmanEnvironment(swaggerSpec, options);

    if (options && options.prettyPrint) {
        return JSON.stringify(postmanEnvironment, null, 4);
    } else {
        return JSON.stringify(postmanEnvironment);
    }
}

/* module function chain */
function convertSwagger (swaggerSpec, convertSwaggerOptions) {
    return { 
        toPostmanCollection: (options) => convertSwaggerToPostman(swaggerSpec, options),
        toPostmanCollectionJson: (options) => convertSwaggerToPostmanJson(swaggerSpec, options),
        toPostmanCollectionFile: (postmanCollectionFilename, options) => {
            console.log(`Saving Postman Collection to file...`);

            var postmanCollectionJson = convertSwaggerToPostmanJson(swaggerSpec, options);

            fs.writeFileSync(postmanCollectionFilename, postmanCollectionJson); 

            console.log(`Saved Postman Collection to file ${postmanCollectionFilename}`)
        },
        toPostmanCollectionPost: (url, options) => {
            var postmanCollectionJson = convertSwaggerToPostmanJson(swaggerSpec, options);
            var postJson = postmanCollectionJson;

            if (options && options.postJsonBuilder && 
                (typeof options.postJsonBuilder) === "function") {
                postJson = options.postJsonBuilder(postmanCollectionJson);
            }

            var response = request("POST", url, { json: postJson })
            
            return response;
        },
        toPostmanEnvironment: (options) => convertSwaggerToPostmanEnvironment(swaggerSpec, options),
        toPostmanEnvironmentJson: (options) => convertSwaggerToPostmanEnvironmentJson(swaggerSpec, options),
        toPostmanEnvironmentFile: (postmanEnvironmentFilename, options) => {
            console.log(`Saving Postman Collection to file...`);

            var postmanCollectionJson = convertSwaggerToPostmanEnvironmentJson(swaggerSpec, options);

            fs.writeFileSync(postmanEnvironmentFilename, postmanCollectionJson); 

            console.log(`Saved Postman Collection to file ${postmanEnvironmentFilename}`)
        },
        toPostmanEnvironmentPost: (url, options) => {
            var postmanEnvironmentJson = convertSwaggerToPostmanEnvironmentJson(swaggerSpec, options);
            var postJson = postmanEnvironmentJson;

            if (options && options.postJsonBuilder && 
                (typeof options.postJsonBuilder) === "function") {
                postJson = options.postJsonBuilder(postmanEnvironmentJson);
            }

            var response = request("POST", url, { json: postJson })
            
            return response;
        }
    }
}

function convertSwaggerJson (swaggerJson, convertSwagger, options) {
    console.log(`Parsing Swagger spec JSON...`);

    var swaggerSpec = JSON.parse(swaggerJson);
    return convertSwagger(swaggerSpec, options);
}

/* module export */
module.exports = {
    convertSwagger: () => ({ 
        fromUrl: (url, options) => {
            console.log(`Reading Swagger spec from URL: ${url}...`);

            var response = request("GET", url);
            var swaggerJson = response.getBody();

            return convertSwaggerJson(swaggerJson, convertSwagger, options);
        },
        fromFile: (filePath, options) => {
            console.log(`Reading Swagger spec from file: ${filePath}...`);

            var swaggerJson = fs.readFileSync(filePath);

            return convertSwaggerJson(swaggerJson, convertSwagger, options);
        },
        fromJson: (swaggerSpecJson, options) => convertSwaggerJson(swaggerJson, convertSwagger, options),
        fromSpec: (swaggerSpec, options) => convertSwagger(swaggerSpec, options)
    })
};
