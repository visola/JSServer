package br.com.depasser.jsservlet;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.JavaScriptException;
import org.mozilla.javascript.Scriptable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.com.depasser.jsservlet.Environment.PROPERTY;
import br.com.depasser.util.ExtendedTimer;
import br.com.depasser.util.Timer.UNIT;

public class JSServlet extends HttpServlet {

	public static final String ATTRIBUTE_PROCESSED = "jsservlet.processed";

	private static final long serialVersionUID = 5407986675299217045L;

	private Logger logger = LoggerFactory.getLogger(JSServlet.class);

	private Environment env;

	private ScopeManager scopeManager;

	private String[] extensions = null;

	private ScriptProcessor processor;

	public JSServlet() {
		this(null);
	}

	public JSServlet(Environment env) {
		this.env = env;
	}

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String scriptName = getScriptName(request);
		logger.debug("Requested file: '" + scriptName + "'");

		/* If the user requested the root file, then use
		 * the default script.
		 */
		if (scriptName.equals("")) {
			scriptName = env.getProperty(PROPERTY.APP_DEFAULT_CONTROLLER);
		}

		// Find script file
		File scriptFile = new File(env.application.getController(), scriptName);

		// Get a scope to the file
		Scriptable scope = scopeManager.getScope(request, response);

		// We need a context in case we get an error
		Context.enter();

		try {
			// Check if trying to access a script out of the scripts directory
			if (!scriptFile.getCanonicalPath().startsWith(env.application.getController().getCanonicalPath())) {
				redirectError(403, "Not authorized.", scope);
				return;
			}

			// Check if it is a 404.do redirect
			if (scriptName.equals("404.js")) {
				redirectError(404, null, scope);
				return;
			}

			// Tells if the request was processed
			boolean requestProcessed = false;

			// If file exist
			if (scriptFile.exists()) {
				processor.runScript(scriptFile, scope);

				// Check for the attribute flag
				boolean processed = Boolean.parseBoolean((String) request.getAttribute(ATTRIBUTE_PROCESSED));
				requestProcessed = processed || requestProcessed;
			}

			// If request was not fully processed by the controller, process the view
			if (requestProcessed != true) {
				File viewFile = new File(env.application.getView(), scriptName);
				if (viewFile.exists()) {
					processor.runScript(viewFile, scope);
					requestProcessed = true;
				}
			}

			// If request was not processed
			if (requestProcessed != true) {
				logger.warn("Script not found: " + scriptName + ", running 404.");
				redirectError(404, "Script not found: " + scriptName, scope);
			}
		} catch (JavaScriptException jse) {
			logger.error("Error while executing script: " + scriptName + ", " + jse.getValue(), jse);
			redirectError(500, jse.getLocalizedMessage(), scope);
		} catch (Exception exception) {
			logger.error("Error while executing script: " + scriptName, exception);
			redirectError(500, exception.getLocalizedMessage(), scope);
		} finally {
			Context.exit();
		}
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		doGet(req, resp);
	}

	/**
	 * <p>
	 * Return a valid <code>File</code> with respect to
	 * <code>currentDirectory</code> or as an absolute path. If after trying
	 * both a valid directory was not found, throws an exception.
	 * </p>
	 *
	 * @param currentDirectory
	 *            Reference directory to use as parent.
	 * @param path
	 *            Path to search for.
	 * @param defaultPath
	 *            If <code>path</code> is null or empty, use this instead.
	 *            Useful when loading paths from configurations where maybe none
	 *            was configured.
	 * @return A valid directory.
	 * @throws ServletException
	 *             If no valid directory was found.
	 */
	private File getDirectory(File currentDirectory, String path,
			String defaultPath) throws ServletException {
		if (path == null || path.equals("")) {
			path = defaultPath;
		}

		File result = new File(currentDirectory, path);

		// If it's not a relative path
		if (!result.exists() || !result.isDirectory()) {
			// Try as an absolute path
			result = new File(path);

			// If still not found, throw new exception
			if (!result.exists() || !result.isDirectory()) {
				logger.error("Invalid directory: " + path);
				throw new ServletException("Invalid directory: " + path);
			}
		}

		return result;
	}

	/**
	 * Strip out the name of the file that was requested.
	 *
	 * @param req
	 *            HttpServletRequest representing the requested file.
	 * @return The file name, replacing the expected extension to
	 *         <code>.js</code>.
	 */
	private String getScriptName(HttpServletRequest req) {
		String scriptName = req.getRequestURI();
		String appContext = req.getContextPath();

		// Remove the context and bar to identify the script to be loaded
		scriptName = scriptName.substring(scriptName.indexOf(appContext)
				+ appContext.length() + 1);

		for (String ext : extensions) {
			if (scriptName.indexOf(ext) != -1) {
				scriptName = scriptName.replace(ext, "js");
				break;
			}
		}

		return scriptName;
	}

	@Override
	public void init(ServletConfig config) throws ServletException {
		super.init(config);

		logger.info("Initializing JSServlet...");

		ServletContext context = getServletContext();
		File currentDirectory = new File(context.getRealPath("."));

		if (env == null) {
			initializeEnv(config, currentDirectory);
		}

		// Process all extensions associated with the JSServlet
		extensions = env.getProperty(PROPERTY.JSSERVLET_EXTENSION).split(",");
		List<String> tempExtensions = new ArrayList<String>();
		for (String ext : extensions) {
			ext = ext.trim();
			if (!ext.equals("")) {
				tempExtensions.add(ext);
			}
		}
		extensions = tempExtensions.toArray(new String[tempExtensions.size()]);

		setupScriptingEnv(context);

		loadApplicationModel();
	}

	/**
	 * Initialize an instance of {@link Environment} using paths configured from
	 * <code>init-parameter</code>.
	 *
	 * @param config
	 *            ServletConfig to read from.
	 * @param currentDirectory
	 *            Current directory for this servlet.
	 * @throws ServletException
	 *             If not possible to determine server or application directory.
	 */
	private void initializeEnv(ServletConfig config, File currentDirectory)
			throws ServletException {
		logger.info("Initializing server configuration...");

		// Read the server directory from init parameter
		File serverDir = getDirectory(currentDirectory, config.getInitParameter("br.com.depasser.jsservlet.directory"), "WEB-INF/server");
		logger.info("Server directory: " + serverDir.getAbsolutePath());

		// Read the application directory from init parameter
		File appDir = getDirectory(currentDirectory, config.getInitParameter("br.com.depasser.jsservlet.application.directory"), "WEB-INF/application");
		logger.info("Application directory: " + serverDir.getAbsolutePath());

		env = new Environment(serverDir, appDir);
	}

	private void loadApplicationModel() {
		logger.info("Initializing application model...");
		File modelDir = env.application.getModel();
		processor.createObjectFromFiles(modelDir, scopeManager.getDefaultScope());
	}

	private void redirectError(int returnCode, String message, Scriptable scope) throws IOException {
		HttpServletResponse response = (HttpServletResponse) RhinoUtils.getJavaObject(scope, "response");

		// Set status code
		response.setStatus(returnCode);

		// Add the message to the scope
		RhinoUtils.addToScriptable(scope, "message", message);

		// Add the the out variable to the scope
		RhinoUtils.addToScriptable(scope, "out", response.getWriter());

		// Check for application error script
		File appError = new File(env.application.getError(), returnCode + ".js");
		if (appError.exists()) {
			processor.runScript(appError, scope);
		} else {
			logger.warn("Application does not have {} error script, running server default.", returnCode);
			File serverError = new File(env.server.getError(), returnCode + ".js");
			processor.runScript(serverError, scope);
		}
	}

	private void setupScriptingEnv(ServletContext servletContext) {
		logger.info("Initializing scripting environment...");

		Context context = Context.enter();

		/*
		 * Create the default scope. This is where everything will be loaded
		 * from and from where all other scopes will be created from. Used to
		 * run every scripts in the server.
		 */
		Scriptable mainScope = new ImporterTopLevel(context);
		scopeManager = new ScopeManager(mainScope);
		processor = new ScriptProcessor(env);

		// Add locations to default scope

		/*
		 * Application context (used to access JSServlet and everything in this
		 * application)
		 */
		RhinoUtils.addToScriptable(mainScope, "APP_ROOT", servletContext.getContextPath());

		// Application directory (where to find application files)
		RhinoUtils.addToScriptable(mainScope, "APP_DIR", env.application .getDirectory().getName());

		// Directory to find controller scripts
		StringBuilder scriptDir = new StringBuilder();
		scriptDir.append(env.application.getDirectory().getName());
		scriptDir.append("/");
		scriptDir.append(env.application.getController().getName());
		RhinoUtils.addToScriptable(mainScope, "SCRIPTS_DIR", scriptDir.toString());

		// Path to use when accessing application resources
		RhinoUtils.addToScriptable(mainScope, "APP_PATH", env.getProperty(PROPERTY.APP_PATH));

		// Path to use when accessing server resources
		RhinoUtils.addToScriptable(mainScope, "SERVER_PATH", env.getProperty(PROPERTY.SERVER_PATH));

		// Add application properties
		RhinoUtils.addToScriptable(mainScope, "APP_PROPS", env);

		try {
			// Add a logger to the script
			Logger scriptLogger = LoggerFactory.getLogger("bootstrap");
			RhinoUtils.addToScriptable(mainScope, "log", scriptLogger);

			// Boot timer
			ExtendedTimer timer = new ExtendedTimer(false);

			// Sever bootstrap
			logger.info("Executing server bootstrap scripts...");
			File bootDir = new File(env.server.getDirectory(), "boot");
			if (bootDir.exists() && bootDir.isDirectory()) {
				File[] bootFiles = bootDir.listFiles();

				if (bootFiles != null) {
					// Guarantee that they will be ordered alphabetically
					Arrays.sort(bootFiles);

					for (File bootFile : bootFiles) {
						// If a Javascript file
						if (bootFile.isFile() && bootFile.getName().endsWith(".js")) {
							logger.debug("Running server boot file: {}", bootFile.getName());
							FileReader bootStrapReader = new FileReader(bootFile);
							timer.startLap();
							context.evaluateReader(mainScope, bootStrapReader, "server_bootstrap_" + bootFile.getName(), 1, null);
							timer.stopLap();
							logger.debug("Boot script finished in: {} microseconds ({} ms)", timer.getLastLap(UNIT.MICRO), timer.getLastLap(UNIT.MILLI));
						}
					}
				}
			}

			// Application bootstrap
			File appBootDir = env.application.getBoot();
			if (appBootDir.exists() && appBootDir.isDirectory()) {
				File[] bootFiles = appBootDir.listFiles();

				if (bootFiles != null) {
					Arrays.sort(bootFiles);

					for (File bootFile : bootFiles) {
						// If a Javascript file
						if (bootFile.isFile() && bootFile.getName().endsWith(".js")) {
							logger.debug("Running application boot file: {}", bootFile.getName());
							FileReader bootStrapReader = new FileReader(bootFile);
							timer.startLap();
							context.evaluateReader(mainScope, bootStrapReader, "application_bootstrap_" + bootFile.getName(), 1, null);
							timer.stopLap();
							logger.debug("Boot script finished in: {} microseconds ({} ms)", timer.getLastLap(UNIT.MICRO), timer.getLastLap(UNIT.MILLI));
						}
					}
				}
			}

			logger.info("Bootstrap finished, total time: {} ms", timer.getTotal(UNIT.MILLI));
		} catch (IOException ioe) {
			logger.error("Error while loading bootstrap file...");
		} finally {
			logger.info("Exiting context...");
			Context.exit();
		}

		logger.info("Scripting environment initialized.");
	}

}
