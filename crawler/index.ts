import * as fs from 'fs';

import * as parsers from './parsers';
import { closeBrowser } from './common';


(async () => {
	Object.entries(parsers).forEach(async ([parserName, parser]) => {
		fs.writeFileSync(`../data/${parserName}.json`, JSON.stringify(await parser(), null, '\t'));
	});

	await closeBrowser();
})();


