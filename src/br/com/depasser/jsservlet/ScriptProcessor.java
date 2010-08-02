package br.com.depasser.jsservlet;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.HashMap;
import java.util.Map;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Scriptable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.com.depasser.jsservlet.Environment.PROPERTY;

/**
 * <p>
 * Responsible for running scripts.
 * </p>
 * 
 * @author Vinicius Isola
 */
public class ScriptProcessor {

	/**
	 * SLF4J logger.
	 */
	private Logger logger = LoggerFactory.getLogger(ScriptProcessor.class);

	/**
	 * Store compiled scripts.
	 */
	protected Map<File, ScriptWrapper> scripts = new HashMap<File, ScriptWrapper>();
	
	/**
	 * Environment to read configurations from.
	 */
	protected final Environment env;

	/**
	 * Create a new instance of this class.
	 */
	public ScriptProcessor(Environment env) {
		super();
		this.env = env;
	}

	/**
	 * Run a javascript file using the specified scope.
	 * 
	 * @param fileName
	 *            Path to the file that should be run.
	 * @param scope
	 *            Scope to use when running the script.
	 * @return The result of executing the script.
	 * @throws RhinoException
	 *             If a javascript error occur while executing the script.
	 * @throws IOException
	 *             If an error occur while reading the file.
	 */
	public Object runScript(String fileName, Scriptable scope)
			throws RhinoException, IOException {
		return runScript(new File(fileName), scope);
	}

	/**
	 * Run a javascript file using the specified scope.
	 * 
	 * @param file
	 *            File that should be run.
	 * @param scope
	 *            Scope to use when running the script.
	 * @return The result of executing the script.
	 * @throws RhinoException
	 *             If a javascript error occur while executing the script.
	 * @throws IOException
	 *             If an error occur while reading the file.
	 */
	public Object runScript(File file, Scriptable scope) throws RhinoException,
			IOException {

		// Get script wrapper or create a new one
		ScriptWrapper wrapper = getScriptWrapper(file);

		// Open context
		Context context = Context.enter();

		try {
			// Run the script
			logger.debug("Executing script: {}", file.getName());
			return wrapper.exec(context, scope);
		} finally {
			Context.exit();
		}
	}

	/**
	 * Return the {@link ScriptWrapper wrapper} for a specified script if
	 * already created. If not available, one will be created and returned.
	 * 
	 * @param file
	 *            File to read the script from.
	 * @return The <code>wrapper</code> for the specified file.
	 */
	protected ScriptWrapper getScriptWrapper(File file) {
		ScriptWrapper wrapper = scripts.get(file);

		// If not loaded, create a wrapper and add it to the map
		if (wrapper == null) {
			wrapper = new ScriptWrapper(file);
			scripts.put(file, wrapper);
		}
		return wrapper;
	}
	
	/**
	 * <p>
	 * Load all files recursively from <code>file</code> loading all of them
	 * using the parent file as the parent scope. This is useful to create a
	 * model from directory structure.
	 * </p>
	 * 
	 * <p>
	 * Example:
	 * </p>
	 * 
	 * <ul>
	 * File structure:
	 * <li>
	 * <ul>
	 * <li>user
	 * <ul>
	 * <li>
	 * User.js - defines many user classes, including User:
	 * 
	 * <pre>
	 * var User = function () {
	 * 	...
	 * }
	 * </pre>
	 * 
	 * </li>
	 * <li>Contact.js - defines many contact classes, including Contact:
	 * 
	 * <pre>
	 * var Contact = function () {
	 * 	...
	 * }
	 * </pre>
	 * 
	 * </li>
	 * </ul>
	 * </li>
	 * </ul>
	 * </li>
	 * </ul>
	 * 
	 * <p>
	 * After calling this method, the object returned will contain an object
	 * <code>user</code> with many classes (functions) inside it, including User
	 * and Contact. To create an instance of them, would be necessary to do the
	 * following:
	 * </p>
	 * 
	 * <pre>
	 * var u = new user.User();
	 * </pre>
	 * 
	 * @param file
	 *            Start reading from here. Can be a file or directory. If file
	 *            will be executed using <code>parent</code> as the scope. If
	 *            directory will add the object created from the directory with
	 *            the same name as the directory to its <code>parent</code>.
	 * @param parent
	 *            Parent object where to create the sub-objects and classes.
	 * @return The parent object if defined. A newly created Scriptable that
	 *         contains all objects created.
	 */
	public Scriptable createObjectFromFiles(File file, Scriptable parent) {
		logger.debug("Creating object from file: " + file.getAbsolutePath());

		Context context = Context.enter();
		try {
			Scriptable obj = null;
			if (parent != null) {
				obj = parent;
			} else {
				obj = context.newObject(parent);
			}

			if (file.isFile()) {
				logger.debug("Evaluating file: " + file.getAbsolutePath());
				try {
					Reader fileIn = new InputStreamReader(new FileInputStream(file), env.getProperty(PROPERTY.APP_ENCODING, "UTF-8"));
					context.evaluateReader(obj, fileIn, file.getAbsolutePath(), 1, null);
				} catch (IOException ioe) {
					logger.error("Error while loading script file.", ioe);
				} catch (RhinoException re) {
					logger.error("Error while executing script file.", re);
				}
			} else {
				File[] subFiles = file.listFiles();
				if (subFiles != null) {
					for (File subFile : subFiles) {
						Scriptable subObj = createObjectFromFiles(subFile, obj);
						RhinoUtils.addToScriptable(obj, subFile.getName(),
								subObj);
					}
				}
			}

			return obj;
		} finally {
			Context.exit();
		}
	}

}