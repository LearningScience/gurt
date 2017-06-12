'use strict';

const log = require('./logs.js'),
	vfs = require('vinyl-fs'),
	chk = require('chokidar'),
	lib = require('bower-files'),
	lazy = require('lazypipe'),
	filt = require('gulp-filter'),
	rmrf = require('rimraf'),
	plum = require('gulp-plumber'),
	sync = require('browser-sync').create(),
	optional = require('optional');

const libs = () => {
	let files = lib().files || [];
	files.unshift('!libs/**/*.*');
	return files;
};

const opts = {
	source: 'code',
	target: 'dist',
	build: false,
	serve: false,
	frags: 'frags',
	chain: 'chain'
};

const exp = module.exports = (argv) => {
	for (let key in opts) {
		opts[key] = argv[key] || opts[key];
	}
	// parse chain
	opts.frags && loads();
	opts.chain && parse();
	// build chain
	opts.build && build();
	opts.serve && serve();
};

/**
 * Utils
 */

var f = {};

const source = (glob) => vfs.src(
	glob || ['**/**/*.*', '!**/{_*,_*/**}'].concat(libs()), {
	cwd: process.cwd() + '/' + opts.source,
	base: opts.source
});

const target = (glob) => vfs.dest(
	glob || '.', {
	cwd: process.cwd() + '/' + opts.target,
	base: opts.target
});

const watch = (glob) => chk.watch(
	glob || '.', {
	cwd: process.cwd() + '/' + opts.source,
	ignoreInitial: true
});

const filter = (glob) => {
	glob = typeof glob === 'string' ? [glob] : glob;
	let pipe = lazy();
	if (!f.restore) {
		pipe = pipe.pipe(() => f = filt(['**/*.*'], {restore: false}));
	}
	if (f.restore) {
		pipe = pipe.pipe(() => f = f.restore);
	}
	if (glob) {
		pipe = pipe.pipe(() => f = filt(glob, {restore: true}));
	}
	return pipe();
};

/**
 * Loads
 */

const loads = () => {
	let frags = opts.frags = opts.frags.split(','),
		files = {};
	for (let i = 0; i < frags.length; i ++) {
		// loads
		files[frags[i]] =
			optional(process.cwd() + '/' + frags[i]) ||
			optional(process.cwd() + '/node_modules/' + frags[i]) ||
			optional(__dirname + '/../../' + frags[i]) ||
			optional(__dirname + '/../node_modules/' + frags[i]);
		// valid
		files[frags[i]] === null && log.thr(
			'Loading Frags:\n`' + frags[i] + '` Invalid file or module.'
		);
		// merge
		for (let key in files[frags[i]]) {
			frags[key] = files[frags[i]][key];
		}
	}
};

/**
 * Parse
 */

const parse = () => {
	let chain = opts.chain = opts.chain.split('.'),
		frags = opts.frags;
	for (let i = 0; i < chain.length; i ++) {
		// parse
		while (typeof frags[chain[i]] === 'string') {
			frags[chain[i]] = frags[chain[i]].split('.');
			chain.splice.apply(chain, [i, 1].concat(frags[chain[i]]));
		}
		// valid
		typeof frags[chain[i]] !== 'function' && log.thr(
			'Parsing Chain:\n`' + chain[i] + '` Invalid node or alias.'
		);
		// merge
		chain[i] = {
			frag: frags[chain[i]],
			name: chain[i]
		};
	}
};

/**
 * Build
 */

const build = (glob) => {
	!glob && rmrf.sync(opts.target);
	// source
	let stream = source(glob);
	stream = stream.pipe(plum(log.cat));
	stream.on('data', () => log.dat());
	// build chain
	for (let i = 0; i < opts.chain.length; i ++) {
		stream.on('finish', () => log.new(opts.chain[i].name));
		stream = opts.chain[i].frag(stream, filter);
		stream = stream.pipe(filter());
		stream.on('finish', () => log.end(opts.chain[i].name));
	}
	// target
	stream.on('data', () => log.dat());
	stream = stream.pipe(plum.stop());
	return stream.pipe(target());
};

/**
 * Serve
 */

const serve = (glob) => {
	build(glob).on('finish', () => sync.init({
		server: opts.target,
		notify: false,
		open: false,
		logPrefix: ':'
	}));
	watch()
	.on('add', (file) => {
		log.add(file);
		build(null).on('finish', sync.reload);
	})
	.on('change', (file) => {
		log.mod(file);
		build(file === 'index.html' ? null : file).pipe(sync.stream());
	})
	.on('unlink', (file) => {
		log.rem(file);
		build(null).on('finish', sync.reload);
	});
};
