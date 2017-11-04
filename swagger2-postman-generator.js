var fs = require("fs")
var Swagger2Postman = require("swagger2-to-postman");
var Swagger2Object = require("swagger2-to-object"); 

var convertSwaggerRoot = require("./convertSwaggerRoot.js");

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
        }
    }
}



/* module export */
module.exports = {
    convertSwagger: () => convertSwaggerRoot(convertSwagger)
};
