##A wrapper for the RotMG API

`npm install realmapi`

###usage

`realmapi(path, options, callback)`

- `path`: the path you want to query, for example `char/list` or `app/init`
- `options`: (optional) object with parameters for the query; see `paths` definition in `index.js` for available and required parameters for each path
  - `options.host`: optionally choose which domain to query: `testing`, `production`, or specify your own; defaults to `production`
- `callback(err, res)`: a node-style callback function; if you don't specify it, the query will still be executed but you will never know if it succeeded
  - `err` is set even if the request succeeded and the response was `<Failure>` or `<Error>`
  - `res` is always a parsed json representation of the response, be it xml or json originally. For xml, `explicitArray` is off and `mergeAttrs` is on, read [`xml2js` docs](https://github.com/Leonidas-from-XIV/node-xml2js/blob/master/README.md) for details.

###example

see `example.js`
