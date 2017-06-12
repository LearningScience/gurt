'use strict';

const tty = process.stdout && process.stdout.isTTY,
	log = require('eazy-logger').Logger().info,
	cur = require('cli-cursor').toggle(!tty),
	hrt = require('pretty-hrtime');

const exp = module.exports;

/**
 * Utils
 */

var n = 0, w = 16, t = 0;

const spaced = (str, n) => {
	n = Math.abs(n - str.length - 1);
	n = '\ ' + ('\ ').repeat(n);
	return str.replace(/\n/g, n) + n;
};

const dotted = (str, n) => {
	n = Math.abs(n - str.length - 1);
	n = '\ ' + ('\.').repeat(n);
	return str.replace(/\n/g, n) + n;
};

const indent = (str, n) => {
	n = Math.abs(n || 1);
	n = '\n' + ('\t').repeat(n);
	return n + str.replace(/\n/g, n) + n;
};

/**
 * Build
 */

exp['new'] = (str) => tty && log(
	'[{blue:•}] %s {magenta:%s} \x1b[1A',
	spaced(str, w),
	hrt(n = 0, t = process.hrtime())
);

exp['dat'] = (str) => tty && log(
	'\x1b[3C {bright:%s}{dim:%s} \x1b[1A',
	('—').repeat( ++ n % (w + 1)),
	('—').repeat(w - n % (w + 1))
);

exp['end'] = (str) => tty && log(
	'[{blue:✔}] %s {magenta:%s} \x1b[0K',
	dotted(str, w),
	hrt(t = process.hrtime(t), n = 0)
);

/**
 * Serve
 */

exp['add'] = (str) => tty && log(
	'\n{green:+++} {green:%s%s} \x1b[0K',
	'./',
	spaced(str)
);

exp['mod'] = (str) => tty && log(
	'\n{green:+-+} {green:%s%s} \x1b[0K',
	'./',
	spaced(str)
);

exp['rem'] = (str) => tty && log(
	'\n{red:---} {red:%s%s} \x1b[0K',
	'./',
	spaced(str)
);

/**
 * Error
 */

exp['err'] = (str) => tty && log(
	'[{red:!}] {red:%s}\n{red:%s} \x1b[0K',
	spaced('Error', w),
	indent(str, 1)
);

exp['thr'] = function (e) {
	exp.err(e);
	if (!tty) {throw e;}
	process && process.exit();
};

exp['cat'] = function (e) {
	exp.err(e.message);
	if (!tty) {throw e;}
	this && this.emit('end');
};
