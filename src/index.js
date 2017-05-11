import { statSync, readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'fs';
import { relative, basename  } from 'path';

export default (opt = {}) => {
	const { template, filename, format } = opt;
	const jsList = [];

	function _traverse(dir) {
		const dirList = readdirSync(dir);
		dirList.forEach(node => {
			const file = `${dir}/${node}`;
			if (statSync(file).isDirectory()) {
				_traverse(file);
			} else {
				if (/\.js$/.test(file)) {
					jsList.push(file);
				}
			}
		});
	}

	return {
		name: 'html',
		onwrite(config) {
			const file = readFileSync(template).toString();
			const { dest, targets } = config;
			let destPath = '';

			if (dest) {
				 // relative(__dirname, dest) will not be equal to dest when dest is a absolute path
				destPath = relative(__dirname, dest);
			} else if (targets) {
				for (const i = 0; i < targets.length; i++) {
					if (format === targets[i].format) {
						destPath = relative(__dirname, targets[i].dest);
					}
				}
			}

			const destDir = destPath.slice(0, destPath.indexOf('/'));
			const destFile = `${destDir}/${filename || basename(template)}`;
			const index = file.indexOf('</body>');

			_traverse(destDir);

			const scripts = jsList.map(node => `<script type="text/javascript" src="${relative(destDir, node)}"></script>\n`).join('');
			const content = `${file.slice(0, index)}${scripts}${file.slice(index)}`;

			existsSync(destFile) && unlinkSync(destFile);
			writeFileSync(destFile, content);
		}
	};
}
