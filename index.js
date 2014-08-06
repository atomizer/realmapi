var xml2js = require('xml2js')
var request = require('request')
var qs = require('querystring')
var crypto = require('crypto')

// CR, aka 'credentials': an object to expand params with
// for example, for web: { guid: 'myemail', password: '1234' }
// for now, caller is responsible for these keys to be sufficient

// special values in the template:
// '!': required field
// null: no default value

var paths = {
	app: {
		globalNews: { language: 'en' },
		init: { game_net: 'rotmg' },
		getLanguageStrings: { languageType: 'en' }
	},
	account: {
		register: {
			guid: genGuid,
			newGUID: '!',
			newPassword: '!',
			entrytag: '',
			isAgeVerified: 1
		},
		verify: { CR: '!' },
		changePassword: { guid: '!', password: '!', newPassword: '!' },
		forgotPassword: { guid: '!' },
		setName: { name: '!', CR: '!' },
		verifyage: { isAgeVerified: 1, CR: '!' },
		sendVerifyEmail: { CR: '!' },
		purchaseCharSlot: { CR: '!' },
		getBeginnerPackageTimeLeft: { CR: '!' },
		purchasePackage: { packageId: '!', CR: '!' },
		purchaseSkin: { skinType: '!', CR: '!' },
		getCredits: { CR: '!' },
		changeEmail: { newGuid: '!', CR: '!' },
		purchaseMysteryBox: {
			CR: '!',
			boxId: '!',
			price: '!', // if on sale, substitute with appropriate values
			currency: '!'
		}
	},
	arena: {
		getPersonalBest: { CR: '!' },
		getRecords: {
			CR: '!',
			type: 'alltime' // 'weekly', 'personal'
		},
	},
	char: {
		list: {
			CR: '!', // required. otherwise "too many failed logins"
			game_net_user_id: '',
			game_net: 'rotmg',
			play_platform: 'rotmg',
			do_login: 0
		},
		'delete': { CR: '!', charId: '!', reason: 1 },
		fame: { accountId: '!', charId: '!' },
		purchaseClassUnlock: {
			classType: '!',
			CR: '!',
			game_net_user_id: '',
			game_net: 'rotmg',
			play_platform: 'rotmg',
			do_login: 0
		}
	},
	fame: {
		list: {
			timespan: 'all', // 'week', 'month'
			accountId: null,
			charId: null
		}
	},
	guild: {
		listMembers: { num: 50, offset: 0, CR: '!' },
		getBoard: { CR: '!' },
		setBoard: { board: '!', CR: '!' }
	},
	mysterybox: {
		getBoxes: { language: 'en', version: 0,	CR: '!' }
	},
	package: {
		getPackages: { CR: null }
	}
}

var HOST = {
	production: 'realmofthemadgod.appspot.com',
	testing: 'rotmgtesting.appspot.com'
}


function genGuid() {
	var h = crypto.createHash('sha')
	h.update(crypto.rng(100))
	return h.digest('hex').toUpperCase()
}


var parser = new xml2js.Parser({
	mergeAttrs: true,
	explicitArray: false
})


function query(path, options, callback) {
	if (typeof options == 'function') {
		callback = options
		options = {}
	}

	if (typeof callback != 'function') callback = function() {}

	path = path.split('/').slice(-2)

	var sample = paths[path[0]]
	if (!sample) return callback('unknown root')
	sample = sample[path[1]]
	if (!sample) return callback('unknown path')
	
	var params = {}
	for (var k in sample) {
		params[k] = sample[k]
		if (k in options) params[k] = options[k]
	}
	for (k in params) {
		if (params[k] == '!') {
			return callback('required field: ' + k)
		}
		if (typeof params[k] == 'function') {
			params[k] = params[k]()
		}
		if (params[k] === null) delete params[k]
	}
	params.ignore = Math.floor(Math.random() * 1e7)
	if (params.hasOwnProperty('CR')) {
		var cr = params.CR
		delete params.CR
		if (Array.isArray(cr)) { // old style, deprecated
			params.guid = cr[0]
			if (typeof cr[1] == 'string') params.password = cr[1]
			if (cr[2]) params.secret = cr[2]
		} else if (typeof cr == 'object') {
			for (k in cr) {
				params[k] = cr[k]
			}
		} else if (typeof cr == 'string') {
			params.guid = cr
			params.password = ''
		}
	}

	var host = HOST.production
	if (options.testing) host = HOST.testing
	if (typeof options.host == 'string') {
		if (options.host in HOST) {
			host = HOST[options.host]
		} else {
			host = options.host
		}
	}
	var uri = 'https://' + host + '/' + path.join('/')

	var req = request.post({
		uri: uri,
		body: qs.stringify(params)
	}, function (e, res, body) {
		if (e) return callback(e)
		if (res.statusCode != 200) {
			return callback('HTTP ' + res.statusCode)
		}
		// try JSON
		var r = ''
		try {
			r = JSON.parse(body)
		} catch (e) {}
		if (r) return callback(null, r)
		
		// JSON failed, try XML
		parser.reset()
		try {
			parser.parseString(body)
		} catch(e) {
			return callback(e)
		}
		var o = parser.resultObject

		if (o.Failure) return callback('[Failure]', o)
		if (o.Error) return callback('[Error] ' + o.Error, o)
		callback(null, o)
	})
}

module.exports = query
