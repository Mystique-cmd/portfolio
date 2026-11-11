const { createProjectsHandler } = require('../projects-api');
const config = require('../github-projects-config.json');

module.exports = createProjectsHandler(() => config);