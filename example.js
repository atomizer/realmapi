var realmapi = require('./index.js')
var util = require('util')

function printpath(path, opts) {
	opts = opts || {}
	realmapi(path, opts, function(err, res) {
		if (err) {
			console.log('>>', path, 'failed:', err)
			return
		}
		console.log('>>', path + ':', util.inspect(res, false, null))
	})
}

printpath('fame/list', { timespan: 'all' })
printpath('char/fame', { accountId: 25006925, charId: 328 })
