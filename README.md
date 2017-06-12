# Gurt

The stream fragment build system

Gurt **Frags** replace Gulp **Tasks**. Instead of explicitly defining a src and dest, frags receive, filter and return the entire source tree as a stream. Frags are then declaratively combined into a pipeline at runtime. This approach provides a more reusable building block, which also happen to be more efficient.

Pipelines are disk-less, streams are piped directly between frags. As a result filtered files "fall through", becoming available to other transforms further down the pipeline for maximum concurrency. Disk I/O is eliminated, incremental builds become a natural feature of any pipeline by only sending changes.

## Install

```sh
npm install -g gurt
```

```sh
man gurt
```

## Usage

For quick start, use [Gurt-Frags](//github.com/learningscience/gurt-frags). To write custom frags, see below:

**Plugs**: Gurt is only a task replacement for Gulp, it still uses Gulp's most excellent Vinyl FS module. This means you can use gulp plugins. Gulp tasks can often be converted into Gurt frags by simply replacing src / dest with filter.

```js
const foo = require('gulp-foo');
const bar = require('gulp-bar');

const exp = module.exports; // Attach all frags
```

**Frags**: These are just functions that receive, filter, transform and return a stream. Each glob is like a branch in the stream and each filter invocation merges previous branches, so the full source tree is available to every glob.

```js
exp['Foo'] = (stream, filter) => stream
	.pipe(filter('**/*.js'))
	.pipe(foo())
	.pipe(filter('**/*.css'))
	.pipe(foo());

exp['Bar'] = (stream, filter) => stream
	.pipe(filter('**/*.js'))
	.pipe(bar())
	.pipe(filter('**/*.css'))
	.pipe(bar());
```

**Chain**: Aliases define a chain to be referenced like a fragment at runtime, `build` and `serve` are default chains used by their respective commands. Feel free to add custom aliases for other chains you might commonly use at runtime.

```js
exp['build'] = 'Foo.Bar';
exp['serve'] = 'Foo';

exp['other'] = 'build.Foo'; // = Foo.Bar.Foo
```

Save your frags as a local file or npm module and use Gurt's `--frags` option to load it. It's possible to mix frags from other modules by including them into yours (`require`), this makes it trivial to extend existing modules.

## Contribute

Suggestions and contributions will be considered. When crafting a pull request please consider if your contribution is a good fit with the project, follow contribution best practices and use the github "flow" workflow.

## License

[The MIT License](LICENSE.md)
