import { setup, update, populateConfig } from './update';

const g = globalThis as any;
g.setup = setup;
g.update = update;
g.populateConfig = populateConfig;
