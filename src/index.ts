/**
 * TODO:
 * http://webglfundamentals.org/webgl/lessons/webgl-less-code-more-fun.html
 */
// Index files
import * as Components from './components';
import * as Graphics from './graphics';
import * as Math from './math';
import * as Resources from './resources';
import * as System from './system';
export {
	Components,
	Graphics,
	Math,
	Resources,
	System,
};

// Root Files
import {default as Core, CoreConfig} from './core';
import {default as Entity, EntityTemplate} from './entity';
import {default as EntityFactory} from './entity-factory';
import {default as Input, KeyCode} from './input';
import {default as Game} from './game';
import {default as Time} from './time';
import {default as Loader} from './loader';
import {default as Parser} from './parser';
export {
	Core, CoreConfig,
	Entity, EntityTemplate,
	EntityFactory,
	Input, KeyCode,
	Game,
	Time,
	Loader,
	Parser
};
