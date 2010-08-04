/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

logger.debug("Creating Response...");
var Response = {
	ATTRIBUTE_NAME : Packages.br.com.depasser.jsservlet.JSServlet.ATTRIBUTE_PROCESSED,
	
	printAndEndRequest : function (req, resp, string) {
		resp.writer.print(string);
		req.setAttribute(this.ATTRIBUTE_NAME, 'true');
	},
	
	sendJSON : function (req, resp, object) {
		resp.setContentType('application/x-json');
		this.printAndEndRequest(req, resp, JSON.encode(object));
	},
	
	sendHTML : function (req, resp, htmlToRender) {
		resp.setContentType('text/html');
		this.printAndEndRequest(req, resp, htmlToRender.render());
	}	
};