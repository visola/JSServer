package br.com.depasser.jsservlet;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;
import java.util.Properties;

import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.com.depasser.jsservlet.Environment.PROPERTY;
import br.com.depasser.util.Timer;

/**
 * <p>
 * This server is used to replace a web container. It can be used as a
 * standalone server to run the JSServlet using the embedded Jetty server.
 * </p>
 *
 * @author Vinicius Isola
 */
public class Server {

	/**
	 * This thread can be used to listen to a shutdown command, that would be
	 * the password established in the configuration file.
	 *
	 * @author Vinicius Isola
	 */
	private class ShutdownListener extends ShutdownThread {
		private ServerSocket listener = null;
		private boolean acceptRemote = false;
		private String password = null;
		private boolean kill = false;

		/**
		 * Create a new <code>ShutdownListener</code> that will wait for the
		 * shutdown command in the specified port, with the specified password.
		 *
		 * @param port
		 *            The port to listen to.
		 * @param password
		 *            The password to wait for.
		 * @param acceptRemote
		 *            True if this server can be shutdown by a remote machine.
		 * @throws IOException
		 *             If an error happens while opening the specified port.
		 */
		public ShutdownListener(int port, String password, boolean acceptRemote)
				throws IOException {
			listener = new ServerSocket(port);
			this.password = password;
			this.acceptRemote = acceptRemote;
			setName("Shutdown Listener");
		}

		/**
		 * Kill this thread.
		 */
		public void kill() {
			kill = true;
			interrupt();
		}

		/**
		 * Wait for client to connect and shutdown the server.
		 */
		@Override
		public void run() {
			while (true) {
				String password = null;
				Socket socket = null;
				BufferedWriter writer = null;
				BufferedReader in = null;
				try {
					socket = listener.accept();
					logger.debug("Shutdown client connected...");
					writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));
					in = new BufferedReader(new InputStreamReader(socket.getInputStream()));

					if (acceptRemote || socket.getInetAddress().isLoopbackAddress()) {
						password = in.readLine();
					}
				} catch (IOException ioe) {
					logger.error("Error while receiving connection.", ioe);
				}

				try {
					if (password != null && password.equals(this.password)) {
						writer.write("OK");
						logger.debug("Password accepted, shutting down...");

						// Run shutdown routine
						super.run();
						break; // Stop this thread
					} else {
						writer.write("Wrong password");
						logger.warn("Someone tried to shutdown the server with the wrong password.");
					}
				} catch (IOException ioe) {
					logger.error("Error while sending answer to client.", ioe);
				} finally {
					if (writer != null) {
						try {
							writer.flush();
							writer.close();
						} catch (IOException ioe) {
							logger.error("Error flushing answer to client.", ioe);
						}
					}
				}

				// Someone is stopping the server
				if (kill) {
					break;
				}
			}
		}
	}

	/**
	 * Shutdown thread, can be used as a shutdown hook.
	 *
	 * @author Vinicius Isola
	 */
	private class ShutdownThread extends Thread {

		public ShutdownThread () {
			setName("Shutdown Thread");
		}

		@Override
		public void run() {
			if (server != null && server.isRunning()) {
				try {
					logger.debug("Shutting down server...");
					server.stop();
					logger.debug("Server stopped.");
				} catch (Exception e) {
					logger.error("Error while shutting down server.", e);
				}
			}

			if (shutdownListener != null && shutdownListener.isAlive()) {
				shutdownListener.kill();
			}
		}
	}

	/**
	 * Start the server.
	 *
	 * @param args
	 *            If one argument is provided, it will be used as the path to
	 *            the configuration file.
	 */
	public static void main(String[] args) {
		if (args != null && args.length > 0) {
			new Server(args[0]);
		} else {
			new Server();
		}
	}

	/**
	 * SLF4J Logger.
	 */
	private Logger logger = LoggerFactory.getLogger(Server.class);

	/**
	 * Jetty server responsible to do the heavy lifting.
	 */
	private org.eclipse.jetty.server.Server server;

	/**
	 * The servlet context.
	 */
	private ServletContextHandler servletContext;

	/**
	 * Thread that will listen for shutdown requests.
	 */
	private ShutdownListener shutdownListener = null;

	/**
	 * Environment configurations.
	 */
	private Environment env;

	/**
	 * Create a new instance of this server that will load configurations from
	 * the default configuration file:
	 * <code>new File("config/server.properties");</code>.
	 */
	public Server() {
		this(null);
	}

	/**
	 * Create a new instance of this server that will load configurations from
	 * the specified file path.
	 *
	 * @param configurationFile
	 *            Path to the configuration file.
	 */
	public Server(String configurationFile) {
		Timer timer = new Timer();

		Runtime.getRuntime().addShutdownHook(new ShutdownThread());

		// Load server and application configuration
		loadConfiguration(configurationFile);

		// Initialize server
		initServer();

		// Create the servlet context
		createContext();

		initJSServlet();

		initTimerFilter();

		initDefaultServlet();

		// Start server
		try {
			logger.info("Starting server...");
			server.start();
		} catch (Exception ex) {
			logger.error("Error while starting server.", ex);
			return;
		}

		initShutdownListener();

		logger.info("Server started in " + timer.timeInMilliseconds() + "ms");

		// Join the server thread
		try {
			server.join();
		} catch (InterruptedException ie) {
			logger.error("Main thread was interrupted.", ie);
		}
	}

	/**
	 * Create and configure the servlet context that will contain everything
	 * needed to run JSServlet and other servlets to serve JSP and static
	 * content.
	 */
	private void createContext() {
		logger.info("Creating context...");

		// Create the servlet with sessions enabled
		servletContext = new ServletContextHandler(ServletContextHandler.SESSIONS);

		server.setHandler(servletContext);

		// Map server configurations to init parameters
		for (Entry<Object, Object> property : env.entrySet()) {
			servletContext.getInitParams().put((String) property.getKey(), (String) property.getValue());
		}

		// Application context root
		servletContext.setContextPath(env.getProperty(PROPERTY.SERVER_CONTEXT_ROOT));

		/*
		 * Where to find resource files? This will be where the server will
		 * search for web content like style sheets and javascript files.
		 */
		servletContext.setResourceBase(env.application.getResource().getAbsolutePath());

		// Add welcome files
		String welcomeFiles = env.getProperty(PROPERTY.APP_WELCOME_FILES);
		if (welcomeFiles != null) {
			List<String> files = new ArrayList<String>();
			for (String file : welcomeFiles.split(",")) {
				files.add(file.trim());
			}
			servletContext.setWelcomeFiles(files.toArray(new String[files.size()]));
		}
	}

	/**
	 * Initialize the default servlet that will serve static resources.
	 */
	private void initDefaultServlet() {
		String extensions;
		// Create the DefaultServlet holder
		ServletHolder defaultServlet = new ServletHolder(new DefaultServlet());

		// Associate DefaultServlet with extensions
		extensions = env.getProperty(PROPERTY.EXTENSION_RESOURCE);
		if (extensions != null) {
			String[] defaultExtensions = extensions.split(",");
			for (String extension : defaultExtensions) {
				logger.debug("Associating DefaultServlet with extension {}", extension);
				servletContext.addServlet(defaultServlet, "*." + extension.trim());
			}
		}
	}

	/**
	 * Initialize the JSServlet.
	 */
	private void initJSServlet() {
		// Create JSServlet holder
		ServletHolder jsServletHolder = new ServletHolder(new JSServlet(env));

		// Set server and application path as initial configuration to it
		jsServletHolder.setInitParameter("br.com.depasser.jsserver.directory",
				env.server.getDirectory().getAbsolutePath());
		jsServletHolder.setInitParameter(
				"br.com.depasser.jsserver.application.directory",
				env.application.getDirectory().getAbsolutePath());

		// Associate the servlet to the configured extensions
		logger.debug("Registering JSServlet for extensions...");
		String extensions = env.getProperty(PROPERTY.JSSERVLET_EXTENSION);
		String[] splitted = extensions.split(",");
		for (String extension : splitted) {
			extension = extension.trim();
			if (extension.equals("")) {
				continue;
			}
			servletContext.addServlet(jsServletHolder, "*." + extension);
			logger.debug("Extension registered: {}", extension);
		}

		// Register the servlet as the root for the context
		boolean registerRoot = Boolean.parseBoolean(env
				.getProperty(PROPERTY.JSSERVLET_ROOT));
		if (registerRoot) {
			logger.debug("Registering JSServlet as root...");
			servletContext.addServlet(jsServletHolder, "/");
		}
	}

	/**
	 * Initialize the Jetty server instance.
	 */
	private void initServer() {
		// Initialize server instance
		String sPort = env.getProperty(PROPERTY.SERVER_PORT);
		int port = 0;
		try {
			port = Integer.parseInt(sPort);
			server = new org.eclipse.jetty.server.Server(port);
		} catch (NumberFormatException nfe) {
			logger.error("Server port must be a number, invalid number: {}",
					sPort, nfe);
			throw new NumberFormatException(
					"Server port must be a number, invalid number: " + sPort);
		}
	}

	/**
	 * Initialize the shutdown listener if configured to use it.
	 */
	private void initShutdownListener() {
		boolean useShutdownListener = Boolean.parseBoolean(env
				.getProperty(PROPERTY.SHUTDOWN_USE));
		if (useShutdownListener) {
			// Start shutdown listener
			boolean acceptRemote = Boolean.parseBoolean(env
					.getProperty(PROPERTY.SHUTDOWN_REMOTE));
			String shutdownPassword = env.getProperty(
					PROPERTY.SHUTDOWN_PASSWORD, "");

			/*
			 * If no password defined, make sure no remote shutdown will be
			 * permitted. If you want to destroy your security, do it explicitly
			 */
			if (shutdownPassword.equals("")) {
				acceptRemote = false;
			}

			int shutdownPort = Integer.parseInt(env
					.getProperty(PROPERTY.SHUTDOWN_PORT));

			logger.debug("Starting shutdown listener port: " + shutdownPort);

			// Start the Thread
			try {
				shutdownListener = new ShutdownListener(shutdownPort,
						shutdownPassword, acceptRemote);
				shutdownListener.start();
			} catch (IOException ioe) {
				logger.error("Error while starting shutdown listener.", ioe);
			}
		}
	}

	/**
	 * Initialize the <code>TimerFilter</code> if configured to use it.
	 */
	private void initTimerFilter() {
		// Timer Filter
		boolean useTimer = Boolean.parseBoolean(env
				.getProperty(PROPERTY.TIMER_USER));
		if (useTimer) {
			servletContext
					.addFilter("br.com.depasser.web.TimerFilter", "/*", 0);
		}
	}

	/**
	 * Load all configurations for the server and application.
	 *
	 * @param configurationFile
	 *            Path to the configuration file. If null, will use
	 *            <code>config/server.properties</code>.
	 */
	private void loadConfiguration(String configurationFile) {
		if (configurationFile == null) {
			configurationFile = "config/server.properties";
		}

		logger.info("Loading server configuration from {}", configurationFile);

		Properties serverProperties = new Properties();

		// Load default server configuration from the classpath
		try {
			URL defaultProps = getClass().getResource("default.properties");
			serverProperties.load(defaultProps.openStream());
		} catch (IOException ioe) {
			logger.error("Error while reading default properties.", ioe);
		}

		// Load server configuration from config directory
		try {
			File serverConfig = new File(configurationFile);
			if (serverConfig.exists() && serverConfig.isFile()) {
				serverProperties.load(new FileInputStream(serverConfig));
			}
		} catch (IOException ioe) {
			logger.error("Error while reading configuration file.", ioe);
		}

		// Get the server directory
		File serverDirectory = new File(
				serverProperties.getProperty(PROPERTY.SERVER_DIR.value));

		// Get the application directory
		File applicationDirectory = new File(
				serverProperties.getProperty(PROPERTY.APP_DIR.value));

		// Create the environment object with all configurations loaded into it
		env = new Environment(serverDirectory, applicationDirectory);

		// Running on an embedded server
		env.server.setEmbedded(true);

		// Map server configurations to environment if not already set
		for (Entry<Object, Object> property : serverProperties.entrySet()) {
			if (env.getProperty((String) property.getKey()) == null) {
				env.setProperty((String) property.getKey(),
						(String) property.getValue());
			}
		}
	}

}