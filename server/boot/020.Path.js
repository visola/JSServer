/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

/*****************************************************
 * Path constructor                                   *
 *****************************************************/
logger.info('Creating path builder...');
var path = {};
 
path.root = function (file) {
	return APP_ROOT + '/' + file;
};

path.app = function (file) {
	if (file) {
		return APP_DIR + '/' + file;
	}
	return APP_DIR;
}

path.controller = function (file) {
	if (file) {
		return SCRIPTS_DIR + '/' + file;
	}
	return SCRIPTS_DIR;
}
 /*****************************************************
 * End of Path constructor                            *
 *****************************************************/