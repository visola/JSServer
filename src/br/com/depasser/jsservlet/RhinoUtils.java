/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
package br.com.depasser.jsservlet;

import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class RhinoUtils {

	public static void addToScriptable(Scriptable scriptable, String name, Object value) {
		Object wrapped = Context.javaToJS(value, scriptable);
		ScriptableObject.putProperty(scriptable, name, wrapped);
	}

	public static void addToScriptable(Scriptable scriptable, String name, Properties props) {
		try {
			// Create the object and add it to the scriptable
			Context context = Context.enter();
			Scriptable obj = context.newObject(scriptable);
			addToScriptable(scriptable, name, obj);

			for (Entry<Object, Object> entry : props.entrySet()) {
				addToScriptable(obj, (String) entry.getKey(), entry.getValue());
			}
		} finally {
			Context.exit();
		}
	}

	@SuppressWarnings("unchecked")
	public static void addToScriptable(Scriptable scriptable, Map<String, Object> params) {
		if (params != null) {
			for (Entry<String, Object> entry : params.entrySet()) {
				if (entry.getValue() instanceof Map) {
					Context context = Context.enter();
					try {
						Scriptable obj = context.newObject(scriptable);

						// Add object to parent
						addToScriptable(scriptable, entry.getKey(), obj);

						// Add subojects to the newly created object
						addToScriptable(obj, (Map<String, Object>) entry.getValue());
					} finally {
						Context.exit();
					}
				} else {
					addToScriptable(scriptable, entry.getKey(), entry.getValue());
				}
			}
		}
	}

	public static Object getJavaObject(Scriptable scope, String name) {
		NativeJavaObject objWrapper = (NativeJavaObject) scope.get(name, null);
		return objWrapper.unwrap();
	}

}