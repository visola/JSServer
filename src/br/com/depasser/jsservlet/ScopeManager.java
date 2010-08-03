/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
package br.com.depasser.jsservlet;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;

/**
 * <p>
 * Controls scope management.
 * </p>
 *
 * @author Vinicius Isola
 */
public class ScopeManager {

	/**
	 * Scope used to create all other scopes.
	 */
	protected final Scriptable defaultScope;

	/**
	 * Create a new instance of this class.
	 *
	 * @param defaultScope
	 *            The scope from where all other scopes will descend from.
	 */
	public ScopeManager(Scriptable defaultScope) {
		this.defaultScope = defaultScope;
	}

	/**
	 * Return the scope that is being used to create all other scopes.
	 *
	 * @return The default scope.
	 */
	public Scriptable getDefaultScope() {
		return defaultScope;
	}

	/**
	 * Return a newly created <code>scope</code> with the request, response,
	 * session (if available) and parameters from the request added to it.
	 *
	 * @param request
	 *            <code>HttpServletRequest</code> to read parameters from. The
	 *            <code>request</code> itself will also be added to the scope.
	 *            If an <code>HttpSession</code> was created, it will also be
	 *            added to the scope.
	 * @param response
	 *            <code>HttpServletResponse</code> to be added to the scope.
	 * @return The newly created scope.
	 * @see #getScope(Map)
	 */
	public Scriptable getScope(HttpServletRequest request, HttpServletResponse response) {
		Map<String, Object> parameters = new HashMap<String, Object>();

		// Add the request object to the scope
		parameters.put("request", request);

		// Add the response object to the scope
		parameters.put("response", response);

		// Add the session object to the scope, if available
		parameters.put("session", request.getSession(false));

		// Add request parameters into a params object
		Map<String, Object> requestParameters = new HashMap<String, Object>();
		parameters.put("params", requestParameters);

		@SuppressWarnings("rawtypes")
		Enumeration names = request.getParameterNames();
		while (names.hasMoreElements()) {
			String name = (String) names.nextElement();
			requestParameters.put(name, request.getParameter(name));
		}

		return getScope(parameters);
	}

	/**
	 * Create a new scope descending from {@link ScopeManager#defaultScope
	 * defaultScope} with all objects added to it.
	 *
	 * @param addToScope
	 *            Objects to be added to the newly created scope.
	 * @return The newly created scope.
	 * @see RhinoUtils#addToScriptable(Scriptable, Map)
	 */
	public Scriptable getScope(Map<String, Object> addToScope) {
		Context context = Context.enter();

		try {
			// Create a new scope descending from the default
			Scriptable newScope = context.newObject(defaultScope);
			newScope.setPrototype(defaultScope);

			// Add variables to scope
			RhinoUtils.addToScriptable(newScope, addToScope);

			return newScope;
		} finally {
			Context.exit();
		}
	}

}