/**
 * Requires the components from command-line configuration, falling back to
 * environment variables and if these are not found, then uses the default
 * implementation.
 *
 * <table>
 *     <tr>
 *         <th>Component</th>
 *         <th>Command-line Option</th>
 *         <th>Environment Variable</th>
 *     </tr>
 *     <tr>
 *         <td>store</td>
 *         <td>--store [alias: s]</td>
 *         <td>SHADES_STORE</td>
 *     </tr>
 *     <tr>
 *         <td>broker</td>
 *         <td>--broker [alias: b]</td>
 *         <td>SHADES_BROKER</td>
 *     </tr>
 *     <tr>
 *         <td>projection</td>
 *         <td>--projection [alias: p]</td>
 *         <td>SHADES_PROJECTIONS</td>
 *     </tr>
 *     <tr>
 *         <td>plugin</td>
 *         <td>--plugin</td>
 *         <td>SHADES_PLUGINS</td>
 *     </tr>
 *     <tr>
 *         <td>config</td>
 *         <td>--config [alias: c]</td>
 *         <td> - </td>
 *     </tr>
 * </table>
 *
 */

const jsonfile = require('jsonfile');
const commandLineArgs = require('command-line-args');

const definitions = [
    { name: 'store', alias: 's', type: String },
    { name: 'broker', alias: 'b', type: String },
    { name: 'projection', alias: 'p', type: String, multiple: true },
    { name: 'config', alias: 'c', type: String },
    { name: 'plugin', type: String, multiple: true }
];
const opts = commandLineArgs(definitions);
const env = process.env;

/**
 * split plugins env var
 * @type {Array.<string>}
 */
const pluginEnv = (env.SHADES_PLUGINS || '')
    .split(',')
    .filter((d => !!d));

/**
 * split projects env var
 * @type {Array.<string>}
 */
const projectionEnv = (env.SHADES_PROJECTIONS || '')
    .split(',')
    .filter((d => !!d));

const storeName = opts.store || process.env.SHADES_STORE;
const brokerName = opts.broker || process.env.SHADES_BROKER;
const projectionNames = opts.projection || projectionEnv;
const pluginNames = opts.plugin || pluginEnv;
const config = opts.config ? jsonfile.readFileSync(opts.config) : {};

/**
 * requires the component modules
 */
const store = require(`shades-store-${storeName}`)(config.store || {});
const broker = require(`shades-broker-${brokerName}`)(config.broker || {});

/**
 * requires plugins
 */
const projections = projectionNames.reduce((acc, projection) => {
    const pConfig = config.projections[projection] || {};
    acc[projection] = require(`shades-projection-${projection}`)(pConfig);
    return acc;
}, {});

/**
 * requires plugins
 */
const plugins = pluginNames.reduce((acc, plugin) => {
    const pConfig = config.plugins[plugin] || {};
    acc[plugin] = require(`shades-plugin-${plugin}`)(pConfig);
    return acc;
}, []);

module.exports = { store, broker, projections, plugins, config };