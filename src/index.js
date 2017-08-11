import { statSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { relative, basename, sep as pathSeperator } from 'path';
import hasha from 'hasha';

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
	const { template, filename, format, externals } = opt;

	return {
		name: 'html',
		onwrite(config, data) {
			const tpl = readFileSync(template).toString();
			const { dest, targets } = config;
			const fileList = [];
			let destPath = '';

			if (dest) {
				// relative('./', dest) will not be equal to dest when dest is a absolute path
				destPath = relative('./', dest);
			} else if (targets) {
				for (let i = 0; i < targets.length; i++) {
					if (format === targets[i].format) {
						destPath = relative('./', targets[i].dest);
					}
				}
			}

			const firstDir = destPath.slice(0, destPath.indexOf(pathSeperator));
			const destFile = `${firstDir}/${filename || basename(tpl)}`;
			const headIndex = tpl.indexOf('</head>');
			const bodyIndex = tpl.indexOf('</body>');
			const jsList = [];
			const cssList = [];

			traverse(firstDir, fileList);

			if (Array.isArray(externals)) {
        let firstBundle = 0;
        for (const node of externals) {
          if (node.pos === 'before') {
            fileList.splice(firstBundle++, 0, node);
          } else {
            fileList.splice(fileList.length, 0, node);
          }
        }
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
					jsList.push(`<script type="text/javascript" src="${src}"></script>\n`);
				} else if (type === 'css') {
					cssList.push(`<link rel="stylesheet" href="${src}">\n`);
				}
			});
			const content = `${tpl.slice(0, headIndex)}${cssList.join('')}${tpl.slice(headIndex, bodyIndex)}${jsList.join('')}${tpl.slice(bodyIndex)}`;

			writeFileSync(destFile, content);
		}
	};
}
