import { mainMenu } from './main.js';
import { chainMenu } from './chain.js';
import { settingsMenu } from './settings.js';

mainMenu.register(chainMenu);
mainMenu.register(settingsMenu);

export { mainMenu, chainMenu, settingsMenu };
