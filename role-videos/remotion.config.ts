import {resolve} from 'node:path';
/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

Config.overrideRspackConfig(config=>({...config,resolve:{...config.resolve,alias:{...config.resolve?.alias,react:resolve('node_modules/react'),'react-dom':resolve('node_modules/react-dom')}}}));
