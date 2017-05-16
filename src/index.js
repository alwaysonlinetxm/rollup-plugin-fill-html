import { statSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { relative, basename  } from 'path';
import hasha from 'hasha';

function traverse(dir, list) {
	const dirList = readdirSync(dir);
	dirList.forEach(node => {
		const file = `${dir}/${node}`;
		if (statSync(file).isDirectory()) {
			traverse(file, list);
		} else {
			if (/\.js$/.test(file)) {
				list.push(file);
			}
		}
	});
}

export default (opt = {}) => {
	const { template, filename, format } = opt;

	return {
		name: 'html',
		onwrite(config, data) {
			const jsList = [];
			const file = readFileSync(template).toString();
			const { dest, targets } = config;
			let destPath = '';
			let hash = '';

			if (dest) {
				// relative(__dirname, dest) will not be equal to dest when dest is a absolute path
				destPath = relative(__dirname, dest);
			} else if (targets) {
				for (let i = 0; i < targets.length; i++) {
					if (format === targets[i].format) {
						destPath = relative(__dirname, targets[i].dest);
					}
				}
			}
			// has set hash
			if (/\[hash\]/.test(destPath)) {
				hash = hasha(data.code, { algorithm: 'md5' });
				// remove the file without hash
				unlinkSync(destPath);
				destPath = destPath.replace('[hash]', hash);
				// data.code will remove the last line of the source code(//# sourceMappingURL=xxx), so it's need to add this
				writeFileSync(destPath, data.code += `//# sourceMappingURL=${basename(dest)}.map`);
			}

			const firstDir = destPath.slice(0, destPath.indexOf('/'));
			const destFile = `${firstDir}/${filename || basename(template)}`;
			const index = file.indexOf('</body>');

			traverse(firstDir, jsList, hash);

			const scripts = jsList.map(node => {
				// just add the latest file
				if (node.indexOf(hash) !== -1) {
					return `<script type="text/javascript" src="${relative(firstDir, node)}"></script>\n`;
				}
				return '';
			}).join('');
			const content = `${file.slice(0, index)}${scripts}${file.slice(index)}`;

			writeFileSync(destFile, content);
		}
	};
}
