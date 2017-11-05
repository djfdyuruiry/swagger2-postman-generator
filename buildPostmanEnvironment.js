var environmentTemplate = {
  id: "685825e6-1261-04aa-3cb6-04c1259b0977",
  name: "Swagger2 Environment",
  values: [
    {
      enabled: true,
      key: "scheme",
      value: "http",
      type: "text"
    },
    {
      enabled: true,
      key: "port",
      value: "80",
      type: "text"
    }, 
    {
      enabled: true,
      key: "host",
      value: "localhost",
      type: "text"
    }
  ],
  timestamp: 1509563973925,
  _postman_variable_scope: "environment",
  _postman_exported_at: "2017-11-03T23:56:14.998Z",
  _postman_exported_using: "Postman/5.3.2"
};

module.exports = function () {
  return JSON.parse(JSON.stringify(environmentTemplate))
}