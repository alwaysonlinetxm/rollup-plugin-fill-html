import fs, { readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { basename, relative, sep } from 'path';
import crypto from 'crypto';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index$2 = createCommonjsModule(function (module) {
'use strict';

var isStream = module.exports = function (stream) {
	return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function';
};

isStream.writable = function (stream) {
	return isStream(stream) && stream.writable !== false && typeof stream._write === 'function' && typeof stream._writableState === 'object';
};

isStream.readable = function (stream) {
	return isStream(stream) && stream.readable !== false && typeof stream._read === 'function' && typeof stream._readableState === 'object';
};

isStream.duplex = function (stream) {
	return isStream.writable(stream) && isStream.readable(stream);
};

isStream.transform = function (stream) {
	return isStream.duplex(stream) && typeof stream._transform === 'function' && typeof stream._transformState === 'object';
};
});

var hasha = function (input, opts) {
	opts = opts || {};

	var outputEncoding = opts.encoding || 'hex';

	if (outputEncoding === 'buffer') {
		outputEncoding = undefined;
	}

	var hash = crypto.createHash(opts.algorithm || 'sha512');

	var update = function (buf) {
		var inputEncoding = typeof buf === 'string' ? 'utf8' : undefined;
		hash.update(buf, inputEncoding);
	};

	if (Array.isArray(input)) {
		input.forEach(update);
	} else {
		update(input);
	}

	return hash.digest(outputEncoding);
};

hasha.stream = function (opts) {
	opts = opts || {};

	var outputEncoding = opts.encoding || 'hex';

	if (outputEncoding === 'buffer') {
		outputEncoding = undefined;
	}

	var stream = crypto.createHash(opts.algorithm || 'sha512');
	stream.setEncoding(outputEncoding);
	return stream;
};

hasha.fromStream = function (stream, opts) {
	if (!index$2(stream)) {
		return Promise.reject(new TypeError('Expected a stream'));
	}

	opts = opts || {};

	return new Promise(function (resolve, reject) {
		stream
			.on('error', reject)
			.pipe(hasha.stream(opts))
			.on('error', reject)
			.on('finish', function () {
				resolve(this.read());
			});
	});
};

hasha.fromFile = function (fp, opts) { return hasha.fromStream(fs.createReadStream(fp), opts); };

hasha.fromFileSync = function (fp, opts) { return hasha(fs.readFileSync(fp), opts); };

var index$1 = hasha;

function traverse(dir, list) {
	var dirList = readdirSync(dir);
	dirList.forEach(function (node) {
		var file = dir + "/" + node;
		if (statSync(file).isDirectory()) {
			traverse(file, list);
		} else {
			if (/\.js$/.test(file)) {
				list.push(file);
			}
		}
	});
}

var index = function (opt) {
	if ( opt === void 0 ) opt = {};

	var template = opt.template;
	var filename = opt.filename;
	var format = opt.format;

	return {
		name: 'html',
		onwrite: function onwrite(config, data) {
			var jsList = [];
			var file = readFileSync(template).toString();
			var dest = config.dest;
			var targets = config.targets;
			var destPath = '';
			var hash = '';

			if (dest) {
				// relative('./', dest) will not be equal to dest when dest is a absolute path
				destPath = relative('./', dest);
			} else if (targets) {
				for (var i = 0; i < targets.length; i++) {
					if (format === targets[i].format) {
						destPath = relative('./', targets[i].dest);
					}
				}
			}
			// has set hash
			if (/\[hash\]/.test(destPath)) {
				hash = index$1(data.code, { algorithm: 'md5' });
				// remove the file without hash
				unlinkSync(destPath);
				destPath = destPath.replace('[hash]', hash);
				// data.code will remove the last line of the source code(//# sourceMappingURL=xxx), so it's need to add this
				writeFileSync(destPath, data.code += "//# sourceMappingURL=" + (basename(dest)) + ".map");
			}

			var firstDir = destPath.slice(0, destPath.indexOf(sep));
			var destFile = firstDir + "/" + (filename || basename(template));
			var index = file.indexOf('</body>');

			traverse(firstDir, jsList, hash);

			var scripts = jsList.map(function (node) {
				// just add the latest file
				if (node.indexOf(hash) !== -1) {
					return ("<script type=\"text/javascript\" src=\"" + (relative(firstDir, node)) + "\"></script>\n");
				}
				return '';
			}).join('');
			var content = "" + (file.slice(0, index)) + scripts + (file.slice(index));

			writeFileSync(destFile, content);
		}
	};
};

export default index;
