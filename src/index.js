import { statSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { relative, basename, sep as pathSeperator } from 'path';
import hasha from 'hasha';
// import cheerio from 'cheerio';
const cheerio = require('cheerio');

function traverse(dir, list) {
	const dirList = readdirSync(dir);
	dirList.forEach(node => {
		const file = `${dir}/${node}`;
		if (statSync(file).isDirectory()) {
			traverse(file, list);
		} else {
			if (/\.js$/.test(file)) {
				list.push({ type: 'js', file });
			} else if (/\.css$/.test(file)) {
				list.push({ type: 'css', file });
			}
		}
	});
}

function isURL(url){
  return /^(((https|http|ftp|rtsp|mms):)?\/\/)+[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/.test(url);
}

export default (opt = {}) => {
	const { template, filename, externals, inject, defaultmode } = opt;

	return {
		name: 'html',
		onwrite(config, data) {
			const $ = cheerio.load(readFileSync(template).toString());
			const head = $('head');
			const body = $('body');
			const { file } = config;
			const fileList = [];
			// relative('./', dest) will not be equal to dest when dest is a absolute path
			const destPath = relative('./', file);
			const firstDir = destPath.slice(0, destPath.indexOf(pathSeperator));
			const destFile = `${firstDir}/${filename || basename(template)}`;

			traverse(firstDir, fileList);

			if (Array.isArray(externals)) {
				let firstBundle = 0;
				externals.forEach(function(node) {
					if (node.pos === 'before') {
						fileList.splice(firstBundle++, 0, node);
					} else {
						fileList.splice(fileList.length, 0, node);
					}
				})
			}

			fileList.forEach(node => {
				let { type, file } = node;
				let hash = '';
				let code = '';

				if (/\[hash\]/.test(file)) {
					if (file === destPath) {
						// data.code will remove the last line of the source code(//# sourceMappingURL=xxx), so it's needed to add this
						code = data.code + `//# sourceMappingURL=${basename(file)}.map`;
					} else {
						code = readFileSync(file).toString();
					}
					hash = hasha(code, { algorithm: 'md5' });
					// remove the file without hash
					unlinkSync(file);
					file = file.replace('[hash]', hash)
					writeFileSync(file, code);
				}

				const src = isURL(file) ? file : relative(firstDir, file);

				if (type === 'js') {
					let attrs = {src: src};
					let mode = node.mode || defaultmode;
					if (mode) attrs.type = mode;
					attrs = Object.entries(([key, val]) => `${key}="${val}"`).join(' ');
					const script = `<script ${attrs}></script>\n`;
					// node.inject will cover the inject
					if (node.inject === 'head' || inject === 'head') {
						head.append(script);
					} else {
						body.append(script);
					}
				} else if (type === 'css') {
					head.append(`<link rel="stylesheet" href="${src}">\n`);
				}
			});
			writeFileSync(destFile, $.html({ decodeEntities: false }));
		}
	};
}
